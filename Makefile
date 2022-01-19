all:
	tree-sitter generate --abi=latest
	tree-sitter test

run: all
	tree-sitter build-wasm
	tree-sitter web-ui
