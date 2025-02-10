library(targets)

setwd("analysis")

Sys.setenv(TAR_PROJECT = "expt3")

print(tar_manifest(), n = Inf)
tar_make()
tar_make(act2InterFit)

targets::tar_meta(fields = warnings, complete_only = TRUE)

tar_read(predFitPlot)
tar_read(actFitPlot)
tar_read(act2FitPlot)
