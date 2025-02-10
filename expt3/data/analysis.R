# package loading

loadPackages <- function() {
  library(tidyverse)
  library(jsonlite)
  library(logr)
  library(brms)
  library(bayestestR)
}

suppressMessages(loadPackages())


# types

#' Data = {
#'  client: Client
#'  testData: List[Trial]
#'  debrief: Debrief
#' }

#' CData = Data & {
#'  condition: Float
#' }

#' Client = {
#'  workerId: Str
#'  studyId: Str
#'  sessionId: Str
#'  completionCode: Str
#' }

#' Trial = {
#'  round: Int
#'  player: 'Ptt' | 'Cpr'
#'  boardConfig: BoardConfig
#'  oppReceiver: 'Opp' | 'Slf' | 'Discard'
#'  pttLambda?: Float
#'  predLambda?: Float
#'  cprLambda?: Float
#'  memory?: Float
#'  actTime: Float
#'  reviewTime: Float
#' }

#' PttTrial = {
#'  round: Int
#'  vx: Float
#'  vy: Float
#'  scale: Float
#'  pttLambda: Float
#'  actTime: Float
#'  reviewTime: Float
#'  id: Str
#'  condition: Float
#' }

#' CprTrial = {
#'  round: Int
#'  vx: Float
#'  vy: Float
#'  scale: Float
#'  predLambda: Float
#'  cprLambda: Float
#'  actTime: Float
#'  reviewTime: Float
#' }

#' BoardConfig = {
#'  vx: Float
#'  vy: Float
#'  scale: Float
#' }

#' Debrief = {
#'  pttToCpr: Int
#'  cprToPtt: Int
#'  adjust: 'y' | 'n'
#'  adjustHow?: Str
#'  noAdjustWhy?: Str
#'  believeBegin: Int
#'  believeEnd: Int
#'  whyNotBelieve?: Str
#'  confusing: 'y' | 'n'
#'  confusingText?: Str
#'  technical: 'y' | 'n'
#'  technicalText?: Str
#' }


# helper functions

concat <- function(v) paste(v, collapse = " ")

aside <- function(x, f) {
  f(x)
  x
}

printf <- function(...) {
  args <- list(...)
  if (length(args) == 0) {
    cat("\n")
  } else {
    cat(sprintf(...), "\n", sep = "")
  }
}

println <- function(...) cat(paste(...), "\n", sep = "")

savePlot <- function(filename, plot_, ...) {
  suppressMessages(ggsave(
    file.path("output", filename),
    plot_,
    ...
  ))
}

CoordSquare <- ggproto("CoordSquare", CoordFixed,
  setup_panel_params = function(self, scale_x, scale_y, params = list()) {
    limits_x <- scale_x$get_limits()
    limits_y <- scale_y$get_limits()
    limits <- c(min(limits_x[1], limits_y[1]), max(limits_x[2], limits_y[2]))
    c(
      ggplot2:::view_scales_from_scale(scale_x, limits, self$expand),
      ggplot2:::view_scales_from_scale(scale_y, limits, self$expand)
    )
  }
)

coord_square <- function(expand = TRUE, clip = "on") {
  ggproto(NULL, CoordSquare,
    ratio = 1,
    expand = expand,
    clip = clip
  )
}


# reading

loadDatasInPath <- function(path) {
  # List[(Str, Data)]
  list.files(path) |>
    keep(\(file_) str_ends(file_, "\\.json")) |>
    map(\(file_) list(file_, read_json(file.path(path, file_))))
}

loadAllDatas <- function() {
  # List[CData]
  list(c("15", "16", "17"), c(0, 0.5, 1)) |>
    pmap(
      \(rootPath, condition) {
        path <- file.path(rootPath, "included")
        list.files(path) |>
          keep(\(file_) str_ends(file_, "\\.json")) |>
          map(
            \(file_) read_json(file.path(path, file_)) |>
              list_assign(condition = condition)
          )
      }
    ) |>
    list_flatten()
}


# processing

# CData -> DF[PttTrial]
getPttTrials <- function(dat) {
  dat$testData |>
    keep(\(x) x$player == "Ptt" && x$oppReceiver == "Opp") |>
    map(
      \(x) keep_at(x, c("round", "boardConfig", "pttLambda", "actTime", "reviewTime")) |>
        list_flatten(name_spec = "{inner}") |>
        list_assign(id = getId(dat$client$workerId), condition = dat$condition) |>
        as_tibble()
    ) |>
    list_rbind()
}

# Data -> (Bool, Str)
passAttChecks <- function(dat) {
  trials <- dat$testData
  slf <- trials |>
    keep(\(x) x$oppReceiver == "Slf") |>
    map(\(x) abs(x$pttLambda - 1) > 0.5)
  discard_ <- trials |>
    keep(\(x) x$oppReceiver == "Discard") |>
    map(\(x) abs(x$pttLambda) > 0.3)
  memory <- trials |>
    keep(\(x) !is.null(x$memory)) |>
    map(\(x) abs(x$memory - ifelse(x$player == "Ptt", x$pttLambda, x$cprLambda)) > 0.3)
  errors <- unlist(c(slf, discard_, memory))
  list(
    sum(errors) <= 2,
    paste(sum(errors), concat(errors))
  )
}

# Str -> Str
getId <- function(file) str_sub(file, 10, 14)


printTechnical <- function(dir_, file) {
  json <- read_json(file.path(dir_, file))
  tt <- json$debrief$technicalText
  if (!is.null(tt)) {
    cat(file, tt, "\n")
  }
}

# DF[PttTrial] ->
pttAnalyses <- function(dat) {
  glimpse(dat)
  # collapsed <- dat |>
  #   summarize(pttLambda = mean(pttLambda), .by = c(id, condition))
  # log_print(cor.test(collapsed$pttLambda, collapsed$condition))
  model <- brm(pttLambda ~ condition * round + (1 + round | id), dat)
}


analyses <- function() {
  loadAllDatas() |>
    map(getPttTrials) |>
    list_rbind() |>
    pttAnalyses()
}

# main

main <- function() {
  log_open("output/output.log", logdir = F, show_notes = F)
  args <- commandArgs(trailingOnly = T)
  cmd <- args[1]
  switch(cmd,
    # exclude
    e = {
      # List[(Str, Bool, Str)]
      results <- loadDatasInPath(args[2]) |>
        map(\(x) c(x[1], passAttChecks(x[[2]])))

      results |>
        walk(\(x) println(x[[1]], x[[3]]))

      println()

      results |>
        discard(\(x) x[[2]]) |>
        walk(\(x) println(x[[1]]))
    },
    # technical
    t = walk(files, \(x) printTechnical(dataPath, x)),
    # analyze
    a = analyses()
  )
  log_close()
}

main()
