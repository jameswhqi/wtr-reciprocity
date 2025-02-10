source("R/common.R")
source("R/expt3.R")

list2(
  tar_target(rawDataDirs, getRawDataDirs(), format = "file"),
  tar_target(dataFile, consolidateData(rawDataDirs), format = "file"),
  tar_target(data, read_json(dataFile)),
  #
  tar_target(predData, getPredData(data)),
  tar_target(predPlot, getPredPlot(predData)),
  #
  tar_target(predFit, getPredFit(predData)),
  tar_target(predHDI, hdi(predFit)),
  tar_target(predFitPlot, getPredPlot(predData, predFit)),
  #
  tar_target(actData, getActData(data)),
  tar_target(actPlot, getActPlot(actData)),
  #
  tar_target(actNullFit, getActFit(actData)),
  #
  tar_target(actMainFit, getActFit(actData, condition = T)),
  tar_target(actMainHDI, hdi(actMainFit)),
  tar_target(actMainBF, bayes_factor(actMainFit, actNullFit)),
  #
  tar_target(actTrialFit, getActFit(actData, condition = T, trialNumber = T)),
  tar_target(actTrialHDI, hdi(actTrialFit)),
  #
  tar_target(actInterFit, getActFit(actData, condition = T, trialNumber = T, interaction = T)),
  tar_target(actInterHDI, hdi(actInterFit)),
  tar_target(actInterBF, bayes_factor(actInterFit, actTrialFit)),
  tar_target(actFitPlot, getActPlot(actData, actInterFit)),
  #
  tar_target(act2Data, filter(actData, trialNumber <= 2)),
  #
  tar_target(act2TrialFit, getActFit(actData, condition = T, trialNumber = T, moTrialNumber = F)),
  tar_target(act2TrialHDI, hdi(act2TrialFit)),
  #
  tar_target(act2InterFit, getActFit(act2Data, condition = T, trialNumber = T, interaction = T, moTrialNumber = F)),
  tar_target(act2InterHDI, hdi(act2InterFit)),
  tar_target(act2InterBF, bayes_factor(act2InterFit, act2TrialFit)),
  tar_target(act2FitPlot, getActPlot(act2Data, act2InterFit)),
)
