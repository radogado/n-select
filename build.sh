./node_modules/clean-css-cli/bin/cleancss -o n-select.min.css n-select.css
./node_modules/terser/bin/terser -o n-select.min.js --compress --mangle -- n-select.js
./node_modules/gzip-size-cli/cli.js --raw n-select.min.css > n-select.min.css.size
./node_modules/gzip-size-cli/cli.js --raw n-select.min.js > n-select.min.js.size
