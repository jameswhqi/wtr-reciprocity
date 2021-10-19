library(jsonlite)
library(stringr)
for (f in list.files()) {
  json <- read_json(f)
  bonus <- json$bonus
  if (bonus > 0) {
    cat(paste0(
      str_sub(json$client$workerId, 10),
      ",",
      json$bonus,
      "\n"
    ))
  }
}
