" Last Change: 2022 Aug 19

lua foo = load("print('hello, world')")
"   ^ lua

lua << END
foo()
END
"  ^ lua
