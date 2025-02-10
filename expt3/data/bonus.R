# package loading

loadPackages <- function() {
  library(tidyverse)
  library(jsonlite)
}

suppressMessages(loadPackages())


# helper functions

println <- function(...) {
  args <- list(...)
  if (length(args) == 0) {
    cat("\n")
  } else {
    cat(sprintf(...), "\n", sep = "")
  }
}


# data processing

getBonus <- function(dir_, file) {
  json <- read_json(file.path(dir_, file))
  totalActual <- map_dbl(json$testData, \(x) getPttPayoff(x, "actual")) |> sum()
  totalLower <- map_dbl(json$testData, \(x) getPttPayoff(x, "lower")) |> sum()
  totalUpper <- map_dbl(json$testData, \(x) getPttPayoff(x, "upper")) |> sum()
  bonus <- round((totalActual - totalLower) / (totalUpper - totalLower), 2)
  println(ifelse(bonus > 0, "%s,%.2f", "!!!%s,%.2f!!!"), str_sub(file, 10, 33), bonus)
}

getPttPayoff <- function(trial, type) {
  pttLambda <- if (trial$oppReceiver == "Slf") {
    1
  } else if (trial$oppReceiver == "Discard") {
    0
  } else {
    switch(type,
      actual = trial$pttLambda,
      lower = 1,
      upper = 0
    )
  }
  if (trial$player == "Ptt") {
    getPayoffs(trial$boardConfig, trial$oppReceiver, pttLambda)$slf
  } else {
    predPayoff <- switch(type,
      actual = getPredPayoff(trial$predLambda, trial$cprLambda),
      lower = 5,
      upper = 10
    )
    getPayoffs(trial$boardConfig, trial$oppReceiver, trial$cprLambda)$opp + predPayoff
  }
}

getPayoffs <- function(boardConfig, oppReceiver, lambda) {
  bc <- boardConfig
  slf <- (bc$vy - lambda^2 / 4 * bc$scale) |> getActualPayoff()
  opp <- (bc$vx + lambda / 2 * bc$scale) |> getActualPayoff()
  switch(oppReceiver,
    Opp = list(slf = slf, opp = opp),
    Slf = list(slf = slf + opp, opp = 0),
    Discard = list(slf = slf, opp = 0)
  )
}

getPredPayoff <- function(l1, l2) {
  max(0, 0.1 - 0.1 * abs(l1 - l2)) |> getActualPayoff()
}

getActualPayoff <- function(x) round(x * 100, 1)


# main

main <- function() {
  dataPath <- commandArgs(trailingOnly = T)
  files <- list.files(dataPath) |>
    keep(\(x) str_ends(x, "\\.json"))
  walk(files, \(x) getBonus(dataPath, x))
}

main()
