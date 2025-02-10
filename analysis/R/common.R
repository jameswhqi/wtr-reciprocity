library(targets)
library(rlang)
suppressMessages(library(dplyr))

tar_option_set(
  packages = unlist(list2(
    "rlang",
    # "dplyr",
    "tidyr",
    # "tibble",
    "purrr",
    "ggplot2",
    # "stringr",
    "jsonlite",
    # "rstan",
    "brms",
    # "bridgesampling",
    "bayestestR"
  )),
  format = "qs"
)

options(mc.cores = parallel::detectCores())

optional <- function(cond, ...) if (cond) list2(...) else list()

assign_if <- function(x, b, where, value) if (b) assign_in(x, where, value) else x

discard_if <- function(x, b, at) if (b) discard_at(x, at) else x

sameName <- function(x, y) trimws(tolower(x)) == trimws(tolower(y))

# listRename <- function(l, before, after) set_names(l, \(name) replace(name, name == before, after))
rename.list <- sloop::s3_get_method(rename.data.frame)

getData <- function(dataFile) {
  read_json(dataFile) |>
    keep(\(p) p$passAttChecks)
}
