#!/bin/sh
echo 'http://localhost:8000/'
exec python3 -m http.server -d ./public -b 127.0.0.1 8000
