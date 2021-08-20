all: test

build:
	npm run build

test: build
	npm run test

run: all
	npm run wasm
	npm run web

download-examples: clean
	git clone --depth=1 https://github.com/neovim/neovim .tests/neovim

parse-examples:
	npm run parse -- -q '.tests/neovim/runtime/**/*.vim'

clean:
	rm -rf .tests

.PHONY: clean download-examples parse-examples all run build test
