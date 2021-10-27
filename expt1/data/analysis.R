library(tidyverse)
library(jsonlite)
library(lmerTest)

setwd("data")
theme_set(theme_bw())

se <- function(v) sd(v) / sqrt(length(v))

# analysis on pilot data
df1 <- map_dfr(c("2", "3", "4"), function(batch) {
  map_dfr(list.files(batch), function(file) {
    cat(file)
    json <- read_json(paste0(batch, "/", file))
    map_dfr(json$trials, ~ as_tibble(.x[c("trialNumber", "selfLambda", "actTime", "reviewTime")]) %>% mutate(scale = .x$selfConfig$scale)) %>%
      mutate(batch = batch, id = json$client$workerId, selfToOpp = json$debrief$selfToOpp, oppToSelf = json$debrief$oppToSelf)
  })
})

df1 %>%
  ggplot(aes(batch, selfLambda)) +
  stat_summary()

df1 %>%
  filter(batch == "4") %>%
  ggplot(aes(trialNumber, selfLambda, color = id)) +
  geom_line()
# geom_jitter(width = .1, height = 0)

df1 %>%
  ggplot(aes(trialNumber, selfLambda, group = batch, color = batch)) +
  stat_summary(position = position_dodge(width = .3))

summary(lm(selfLambda ~ trialNumber, df1))

df1 %>%
  ggplot(aes(scale, selfLambda, color = id)) +
  geom_line()

df1 %>%
  # filter(actTime < 100) %>%
  ggplot(aes(trialNumber, actTime, color = id)) +
  geom_line()

df1 %>%
  # filter(reviewTime < 100) %>%
  ggplot(aes(trialNumber, reviewTime, color = id)) +
  geom_line()

summary(lm(selfLambda ~ batch, df1))

df2 <- df1 %>%
  mutate(time = actTime + reviewTime) %>%
  group_by(id) %>%
  summarize(
    batch = batch[1],
    selfToOpp = selfToOpp[1],
    oppToSelf = oppToSelf[1],
    time = median(time),
    lambda.mean = mean(selfLambda),
    lambda.sd = sd(selfLambda)
  )

df2 %>%
  ggplot(aes(time, lambda.mean, ymin = lambda.mean - lambda.sd, ymax = lambda.mean + lambda.sd, color = batch)) +
  geom_pointrange()

df2 %>%
  ggplot(aes(selfToOpp, lambda.mean, ymin = lambda.mean - lambda.sd, ymax = lambda.mean + lambda.sd, color = batch)) +
  geom_pointrange(position = position_jitter(width = .2))

df3 <- df1 %>%
  group_by(id) %>%
  summarize(batch = batch[1], selfToOpp = selfToOpp[1], oppToSelf = oppToSelf[1])

df3 %>%
  ggplot(aes(batch, oppToSelf)) +
  geom_jitter(width = .2, height = 0) +
  geom_label(aes(label = id))

# debrief ----
debrief <- map_dfr(c("2", "3", "4"), function(batch) {
  map_dfr(list.files(batch), function(file) {
    cat(file)
    json <- read_json(paste0(batch, "/", file))
    as_tibble(json$debrief) %>%
      mutate(batch = batch, id = json$client$workerId)
  })
})
debrief %>%
  filter(technical == "y") %>%
  pull(technicalText)

# 1st to 2nd trial
df1 %>%
  filter(batch == "4", trialNumber <= 2) %>%
  pivot_wider(c(trialNumber, id), names_from = trialNumber, values_from = selfLambda) %>%
  ggplot(aes(`1`, `2`)) +
  geom_point() +
  geom_abline(slope = 1)

# catch trials comparison across platforms ----
df10 <- map_dfr(6:14, function(batch) {
  map_dfr(list.files(as.character(batch)), function(file) {
    cat(file)
    json <- read_json(paste0(batch, "/", file))
    selfErrors <- tibble(
      kind = "self",
      error = map_dbl(keep(json$trials, ~ .$kind == "normal" && .$oppReceiver == "self"), ~ abs(.$selfLambda - 1))
    )
    discardErrors <- tibble(
      kind = "discard",
      error = map_dbl(keep(json$trials, ~ .$kind == "normal" && .$oppReceiver == "discard"), ~ abs(.$selfLambda))
    )

    normalTrials <- keep(json$trials, ~ .$kind == "normal")
    memoryTrials <- keep(json$trials, ~ .$kind == "memory")
    memoryErrors <- simplify_all(transpose(map(memoryTrials, function(trial) {
      prevTrial <- detect(normalTrials, ~ .$trialNumber == trial$trialNumber)
      list(
        self = abs(trial$selfLambda - prevTrial$selfLambda),
        opp = abs(trial$oppLambda - prevTrial$oppLambda)
      )
    })))
    memorySelfErrors <- tibble(
      kind = "memorySelf",
      error = memoryErrors$self
    )
    memoryOppErrors <- tibble(
      kind = "memoryOpp",
      error = memoryErrors$opp
    )

    bind_rows(
      selfErrors,
      discardErrors,
      memorySelfErrors,
      memoryOppErrors
    ) %>%
      mutate(
        batch = batch,
        id = json$client$workerId,
        oppLambda = mean(c(json$config$minOppLambda, json$config$maxOppLambda)),
        platform = case_when(
          batch <= 8 ~ "mturk",
          batch <= 11 ~ "sona",
          T ~ "prolific"
        )
      )
  })
})
df10 %>%
  ggplot(aes(kind, error, color = platform)) +
  geom_linerange(stat = "summary", position = position_dodge(width = .5), size = 2)
df10 %>%
  ggplot(aes(kind, error, color = platform)) +
  geom_point(position = position_dodge(width = .5), alpha = .1) +
  stat_summary(position = position_dodge(width = .5))

getError <- function(kind_, platform_) {
  df <- df10 %>%
    filter(kind == kind_, platform == platform_)
  summ <- summary(lmer(error ~ 1 + (1 | id), df))
  tibble(
    errorMean = summ$coefficients[1, 1],
    errorSe = summ$coefficients[1, 2]
  )
}
df11 <- expand_grid(
  kind = unique(df10$kind),
  platform = unique(df10$platform)
) %>%
  rowwise() %>%
  mutate(getError(kind, platform))
df11 %>%
  ggplot(aes(kind, errorMean, color = platform, ymin = errorMean - errorSe, ymax = errorMean + errorSe)) +
  geom_bar(stat = "identity", position = position_dodge(width = .6), fill = "white", width = .5) +
  geom_linerange(position = position_dodge(width = .6), size = 2) +
  scale_y_continuous(breaks = seq(0, 2, .5), minor_breaks = NULL) +
  labs(x = "Catch trial type", y = "Absolute error in lambda", color = "Platform")
ggsave("error1.pdf", width = 6, height = 4)

df11 %>%
  ggplot(aes(kind, errorMean, color = platform, ymin = errorMean - errorSe, ymax = errorMean + errorSe)) +
  geom_bar(stat = "identity", position = position_dodge(width = .6), fill = "white", width = .5) +
  geom_linerange(position = position_dodge(width = .6), size = 2) +
  geom_point(aes(kind, error, color = platform), df10, inherit.aes = F, position = position_jitterdodge(jitter.width = .1, dodge.width = .6), alpha = .2, size = 1) +
  labs(x = "Catch trial type", y = "Absolute error in lambda", color = "Platform")
ggsave("error2.pdf", width = 6, height = 4)

# time spent
df15 <- map_dfr(6:14, function(batch) {
  map_dfr(list.files(as.character(batch)), function(file) {
    cat(file)
    json <- read_json(paste0(batch, "/", file))
    map_dfr(
      keep(json$trials, ~ .$kind == "normal"),
      ~ as_tibble(.x[c("trialNumber", "actTime", "reviewTime")]) %>%
        mutate(scale = .x$selfConfig$scale)
    ) %>%
      mutate(
        batch = batch,
        id = json$client$workerId,
        platform = case_when(
          batch <= 8 ~ "mturk",
          batch <= 11 ~ "sona",
          T ~ "prolific"
        )
      )
  })
})

df15 %>%
  mutate(time = actTime + reviewTime) %>%
  ggplot(aes(platform, time)) +
  stat_summary()

# analysis of batch 6-14 ----
df20 <- map_dfr(6:14, function(batch) {
  map_dfr(list.files(as.character(batch)), function(file) {
    cat(file)
    json <- read_json(paste0(batch, "/", file))
    map_dfr(
      keep(json$trials, ~ .$kind == "normal" && .$oppReceiver == "opp"),
      ~ as_tibble(.x[c("trialNumber", "selfLambda", "actTime", "reviewTime")]) %>%
        mutate(
          oppScale = .x$oppConfig$scale,
          oppVertexSelf = .x$oppConfig$vertexSelf,
          oppVertexOpp = .x$oppConfig$vertexOpp
        )
    ) %>%
      mutate(
        batch = batch,
        id = json$client$workerId,
        oppLambda = mean(c(json$config$minOppLambda, json$config$maxOppLambda)),
        selfToOpp = json$debrief$selfToOpp,
        oppToSelf = json$debrief$oppToSelf,
        platform = case_when(
          batch <= 8 ~ "mturk",
          batch <= 11 ~ "sona",
          T ~ "prolific"
        )
      )
  })
})

exclude <- df10 %>%
  filter(error > 2) %>%
  # count(id) %>%
  # filter(n > 1) %>%
  pull(id) %>%
  unique()
df21 <- df20 %>%
  filter(!(id %in% exclude))

df20 %>%
  ggplot(aes(as.factor(oppLambda), selfLambda)) +
  geom_linerange(stat = "summary", size = 2) +
  labs(x = "Opponent lambda", y = "Participant's lambda toward opponent")
ggsave("lambda1.pdf", width = 4, height = 4)

df20 %>%
  ggplot(aes(oppLambda, selfLambda, color = platform)) +
  stat_summary()

df20 %>%
  mutate(selfLambda = case_when(
    selfLambda > 2 ~ 2,
    selfLambda < -2 ~ -2,
    T ~ selfLambda
  )) %>%
  ggplot(aes(oppLambda, selfLambda, color = platform)) +
  geom_point(position = position_dodge(width = .5), alpha = .1) +
  stat_summary(position = position_dodge(width = .5))

df20 %>%
  ggplot(aes(oppLambda, oppToSelf)) +
  stat_summary()

# 1st to 2nd trial ----
df20 %>%
  filter(trialNumber <= 2) %>%
  pivot_wider(
    c(id, oppLambda),
    names_from = trialNumber,
    names_prefix = "trial",
    values_from = selfLambda
  ) %>%
  mutate(diff = trial2 - trial1) %>%
  ggplot(aes(oppLambda, diff)) +
  stat_summary()

# debrief ----
debrief <- map_dfr(6:14, function(batch) {
  map_dfr(list.files(as.character(batch)), function(file) {
    cat(file)
    json <- read_json(paste0(batch, "/", file))
    as_tibble(json$debrief) %>%
      mutate(
        batch = batch,
        id = json$client$workerId,
        platform = case_when(
          batch <= 8 ~ "mturk",
          batch <= 11 ~ "sona",
          T ~ "prolific"
        )
      )
  })
})
debrief %>%
  filter(adjust == "n") %>%
  pull(noAdjustWhy)
debrief %>%
  filter(str_length(purpose) > 20) %>%
  pull(purpose)

# responding to previous diff ----
calcPayoffs <- function(scale, vertexSelf, vertexOpp, lambda) {
  tibble(
    payoffSelf = vertexSelf - lambda * lambda / 4 * scale,
    payoffOpp = vertexOpp + lambda / 2 * scale
  )
}
shift <- function(v) c(NA, v[1:(length(v) - 1)])
df22 <- df20 %>%
  rowwise() %>%
  mutate(calcPayoffs(oppScale, oppVertexSelf, oppVertexOpp, selfLambda)) %>%
  group_by(id) %>%
  mutate(prevDiff = shift(payoffOpp - payoffSelf)) %>%
  drop_na(prevDiff)

df22 %>%
  ggplot(aes(prevDiff, selfLambda)) +
  geom_point(alpha = .1) +
  geom_smooth(method = "lm") +
  facet_wrap(vars(oppLambda), labeller = function(labels) {
    labels %>% mutate(oppLambda = paste0("Opponent lambda = ", oppLambda))
  }) +
  scale_y_continuous(breaks = seq(-10, 10, 1)) +
  labs(x = "Opponent's payoff difference in previous round", y = "Participant's lambda toward opponent in current round")
ggsave("diff.pdf", width = 6, height = 6)

# mixed-effects model ----
model1 <- lmer(selfLambda ~ oppLambda + prevDiff + (prevDiff | id), df22)
summary(model1)
anova(model)

getSelfLambda1 <- function(oppLambda_) {
  df <- df22 %>%
    filter(oppLambda == oppLambda_)
  summ <- summary(lmer(selfLambda ~ 1 + (1 | id), df))
  tibble(
    selfLambdaMean = summ$coefficients[1, 1],
    selfLambdaSe = summ$coefficients[1, 2]
  )
}
df30 <- tibble(oppLambda = unique(df22$oppLambda)) %>%
  rowwise() %>%
  mutate(getSelfLambda1(oppLambda))
df30 %>%
  ggplot(aes(as.factor(oppLambda), ymin = selfLambdaMean - selfLambdaSe, ymax = selfLambdaMean + selfLambdaSe)) +
  geom_linerange(size = 2) +
  labs(x = "Opponent lambda", y = "Participant's lambda toward opponent")
ggsave("lambda2.pdf", width = 4, height = 4)

getSelfLambda2 <- function(oppLambda_, platform_) {
  df <- df22 %>%
    filter(oppLambda == oppLambda_, platform == platform_)
  summ <- summary(lmer(selfLambda ~ 1 + (1 | id), df))
  tibble(
    selfLambdaMean = summ$coefficients[1, 1],
    selfLambdaSe = summ$coefficients[1, 2]
  )
}
df31 <- expand_grid(
  oppLambda = unique(df22$oppLambda),
  platform = unique(df22$platform)
) %>%
  rowwise() %>%
  mutate(getSelfLambda2(oppLambda, platform))
df31 %>%
  ggplot(aes(as.factor(oppLambda), color = platform, ymin = selfLambdaMean - selfLambdaSe, ymax = selfLambdaMean + selfLambdaSe)) +
  geom_linerange(position = position_dodge(width = .5), size = 2) +
  scale_y_continuous(breaks = seq(-1, 1, .2)) +
  labs(x = "Opponent lambda", y = "Participant's lambda toward opponent", color = "Platform")
ggsave("lambda3.pdf", width = 5, height = 4)