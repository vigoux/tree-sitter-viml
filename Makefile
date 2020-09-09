all:
	tree-sitter generate
	tree-sitter test

run: all
	tree-sitter build-wasm
	tree-sitter web-ui
