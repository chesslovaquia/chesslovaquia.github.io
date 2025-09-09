#!/bin/sh
set -eu

# Check https://www.w3schools.com/w3css/

w3css_version='5'
w3css_url="https://www.w3schools.com/w3css/${w3css_version}/w3.css"

w3css_dst='themes/clvq/assets/css/w3.css'

echo "wget ${w3css_url}"

wget -q -c -O "${w3css_dst}" "${w3css_url}"

exit 0
