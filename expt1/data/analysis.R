library(tidyverse)
library(jsonlite)

setwd("data")

se <- function(v) sd(v) / sqrt(length(v))

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
  geom_point(position = position_dodge(width = .5), alpha = .1) +
  stat_summary(position = position_dodge(width = .5))