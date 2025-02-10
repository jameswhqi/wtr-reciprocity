dataFilePath <- "expt3.json"

getRawDataDirs <- function() {
  paste0("../expt3/data/", 15:17, "/included")
}

consolidateData <- function(dataDirs) {
  result <- map2(dataDirs, c(0, 0.5, 1), \(dataDir, condition) {
    list.files(dataDir, full.names = T) |>
      map(
        \(fileName) read_json(fileName) |>
          discard_at("client") |>
          rename(trials = testData) |>
          assign_in("condition", condition)
      )
  }) |>
    list_flatten()
  write_json(result, dataFilePath, pretty = 2, auto_unbox = T, null = "null", digits = I(6))
  dataFilePath
}

getPredActData <- function(player, toKeep, response) {
  function(data) {
    data |>
      imap(
        \(ptt, i) ptt$trials |>
          keep(\(trial) trial$player == player && trial$oppReceiver == "Opp") |>
          imap(
            \(trial, j) trial |>
              keep_at(toKeep) |>
              list_flatten(name_spec = "{inner}") |>
              list_assign(
                pttId = i,
                trialNumber = j,
                condition = ordered(ptt$condition, levels = c(0, 0.5, 1))
              ) |>
              as_tibble()
          ) |>
          list_rbind()
      ) |>
      list_rbind() |>
      mutate(censored = case_match(
        !!rlang::sym(response),
        1.5 ~ "right",
        -0.5 ~ "left",
        .default = "none"
      ))
  }
}

getPredData <- getPredActData(
  "Cpr",
  c("round", "boardConfig", "predLambda", "cprLambda", "actTime", "reviewTime"),
  "predLambda"
)

getActData <- getPredActData(
  "Ptt",
  c("round", "boardConfig", "pttLambda", "actTime", "reviewTime"),
  "pttLambda"
)

getPredFit <- function(predData) {
  # get_prior(predLambda | cens(censored) ~ mo(condition) + (1 | pttId), predData)
  brm(
    predLambda | cens(censored) ~ mo(condition) + (1 | pttId),
    predData,
    prior = c(
      prior(normal(0, 0.5), class = b),
      prior(normal(0, 0.5), class = Intercept),
      prior(lognormal(-1, 1), class = sd),
      prior(lognormal(0, 1), class = sigma)
    )
  )
}

getPredPlot <- function(predData, predFit = NULL) {
  p <- ggplot(predData, aes(trialNumber, predLambda, color = condition)) +
    geom_jitter(width = .3, height = 0, alpha = 0.5) +
    stat_summary(position = position_dodge(.3)) +
    scale_color_hue() +
    scale_fill_hue() +
    theme_bw() +
    scale_x_continuous(
      breaks = unique(predData$trialNumber),
      minor_breaks = NULL
    )
  if (is.null(predFit)) {
    p
  } else {
    eff <- conditional_effects(predFit)$condition
    effData <- eff |>
      select(!predLambda) |>
      rename(predLambda = estimate__) |>
      uncount(10) |>
      mutate(trialNumber = rep_along(predLambda, 1:10))
    p +
      geom_smooth(aes(ymin = lower__, ymax = upper__, fill = condition), effData, stat = "identity")
  }
}

getActFit <- function(actData, condition = FALSE, trialNumber = FALSE, interaction = FALSE, moTrialNumber = TRUE) {
  # get_prior(pttLambda | cens(censored) ~ mo(condition, id = "c") * mo(trialNumber, id = "t") + (1 + mo(trialNumber, id = "t") | pttId), actData)
  termC <- expr(mo(condition, id = "c"))
  if (moTrialNumber) {
    termT <- expr(mo(trialNumber, id = "t"))
    coefT <- expr(motrialNumberidEQt)
  } else {
    termT <- expr(trialNumber)
    coefT <- expr(trialNumber)
  }

  popTerm <- case_when(
    !condition ~ list(1),
    !trialNumber ~ list(termC),
    !interaction ~ list(expr(!!termC + !!termT)),
    .default = list(expr(!!termC * !!termT))
  )
  groupTerm <- case_when(
    !trialNumber || !moTrialNumber ~ list(1),
    .default = list(termT)
  )
  priors <- list2(
    prior(normal(0, 0.5), class = Intercept),
    prior(lognormal(-1, 1), class = sd, group = pttId, coef = Intercept),
    prior(lognormal(0, 1), class = sigma),
    optional(
      condition,
      prior(normal(0, 0.5), class = b, coef = moconditionidEQc)
    ),
    optional(
      trialNumber,
      eval(expr(prior(normal(0, 0.1), class = b, coef = !!coefT)))
    ),
    optional(
      trialNumber && moTrialNumber,
      eval(expr(prior(lognormal(-2, 1), class = sd, group = pttId, coef = !!coefT)))
    ),
    optional(
      interaction,
      eval(expr(prior(normal(0, 0.2), class = b, coef = moconditionidEQc:!!coefT)))
    ),
  ) |> list_flatten()

  eval(expr(brm(
    pttLambda | cens(censored) ~ !!popTerm[[1]] + (!!groupTerm[[1]] | pttId),
    actData,
    prior = c(!!!priors),
    iter = 5000,
    save_pars = save_pars(all = T),
  )))
}

getActPlot <- function(actData, actFit = NULL) {
  layers <- list2(
    geom_jitter(aes(trialNumber, pttLambda, color = condition), actData, inherit.aes = F, width = .3, height = 0, alpha = 0.5),
    stat_summary(aes(trialNumber, pttLambda, color = condition), actData, inherit.aes = F, position = position_dodge(.3)),
    scale_color_hue(),
    scale_fill_hue(),
    theme_bw(),
    scale_x_continuous(
      breaks = unique(actData$trialNumber),
      minor_breaks = NULL
    )
  )
  if (is.null(actFit)) {
    ggplot() + layers
  } else {
    p <- plot(conditional_effects(actFit), plot = F)[["trialNumber:condition"]]
    p + layers
  }
}
