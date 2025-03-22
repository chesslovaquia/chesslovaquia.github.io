#!/bin/sh
set -eu
ver="${1:?'version?'}"
install -v -d ./static/w3css
install -v -d "./static/w3css/${ver}"
wget -q -c -O "./static/w3css/${ver}/w3.css" \
	"https://www.w3schools.com/w3css/${ver}/w3.css"
exit 0
