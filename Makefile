all:
	tree-sitter generate

run: all
	tree-sitter build-wasm
	tree-sitter web-ui
