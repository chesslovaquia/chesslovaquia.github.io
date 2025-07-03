#!/bin/sh
echo 'http://localhost:8000/public/'
exec python3 -m http.server -d . -b 127.0.0.1 8000
