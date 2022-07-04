all:
	npm run test

run: all
	tree-sitter build-wasm
	tree-sitter web-ui
