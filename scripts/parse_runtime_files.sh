#!/bin/sh

BASE_URL="https://raw.githubusercontent.com/neovim/neovim"
OUT_PATH="/tmp/rt_file.vim"

FILES="pack/dist/opt/matchit/autoload/matchit.vim"

for file in "$FILES"
do
  echo "Doing $file"
  wget -O "$OUT_PATH" "$BASE_URL/$NVIM_VERSION/runtime/$file"
  npm run parse -- --quiet "$OUT_PATH" || exit 1
done
