library(tidyverse)

pttOffsets1 <- rnorm(20, 0, .5)
pttOffsets2 <- rnorm(20, 0, .2)

df <- expand_grid(
  trialNumber = 1:2,
  pttId = 1:20,
  repetition = 1:20
) |>
  mutate(
    pttLambda = pttOffsets1[pttId] + pttOffsets2[pttId] * trialNumber + rnorm(n(), 0, .1)
  )

fit <- brm(
  pttLambda ~ (1 + trialNumber | pttId),
  df
)
conditional_effects(fit)
