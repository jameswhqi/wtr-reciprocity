function start
  elm-live src/Main.elm -u -- --output=main.js
end

function debug
  elm-live src/Main.elm -u -- --output=main.js --debug
end

function build
  if test -e build
    rm -r build
  end

  mkdir build

  set input src/Main.elm
  set temp build/temp.js
  set output build/main.js

  elm make --optimize --output=$temp $input
  # elm make --output=$temp $input

  set compressOpts "pure_funcs=[F2,F3,F4,F5,F6,F7,F8,F9,A2,A3,A4,A5,A6,A7,A8,A9],pure_getters,keep_fargs=false,unsafe_comps,unsafe"

  uglifyjs $temp --compress $compressOpts | uglifyjs --mangle --output $output
  # cp $temp $output

  echo "Compiled size:$(cat $temp | wc -c)"
  echo "Minified size:$(cat $output | wc -c)"
  echo "Gzipped size: $(gzip -c $output | wc -c)"

  rm $temp

  cp index.html build/index.html
  cp submit.simple.php build/submit.simple.php
  mkdir build/data
end

$argv[1]
