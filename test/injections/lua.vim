" Last Change: 2022 Jul 04

lua foo = load("print('hello, world')")
  " ^ lua

lua << END
foo()
-- <- lua
END
