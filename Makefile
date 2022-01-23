all:
	tree-sitter generate --abi=13
	tree-sitter test

run: all
	tree-sitter build-wasm
	tree-sitter web-ui
