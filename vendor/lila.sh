#!/bin/sh
set -eu

# Check https://github.com/lichess-org/lila

lila_raw=https://github.com/lichess-org/lila/raw/master
lila_dir=./static/lila

mkdir -vp "${lila_dir}"

#
# license
#
for f in COPYING.md LICENSE README.md; do
	src="${lila_raw}/${f}"
	dst="${lila_dir}/${f}"
	echo "${src}"
	echo "  ${dst}"
	wget -q -c -O "${dst}" "${src}"
done

#
# board
#
mkdir -vp "${lila_dir}/public/images/board"
src="${lila_raw}/public/images/board/wood4.jpg"
dst="${lila_dir}/public/images/board/wood4.jpg"
echo "${src}"
echo "  ${dst}"
wget -q -c -O "${dst}" "${src}"

exit 0
