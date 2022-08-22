" Last Change: 2022 Aug 19

command
" <- keyword

com
" <- keyword

command UserCommand
" <- keyword
"         ^ function.macro

command UserCommand call Test()
" <- keyword
"         ^ function.macro
"                     ^ keyword
"                         ^ function
"                            ^ punctuation.bracket
"                             ^ punctuation.bracket

command -complete=syntax ToggleSyntax if exists("g:syntax_on") | syntax off | else | syntax enable | endif
" <- keyword
"         ^ property
"                    ^ constant
"                           ^ function.macro
"                                     ^ conditional
"                                         ^ function
"                                                   ^ string
"                                                                 ^ keyword
"                                                                       ^ keyword
"                                                                               ^ conditional
"                                                                                       ^ keyword
"                                                                                             ^ keyword
"                                                                                                     ^ conditional

command -nargs=1 -complete=mapping Show echo "this is an error message"
" <- keyword
"         ^ property
"              ^ number
"                   ^ property
"                           ^ constant
"                                   ^ function.macro
"                                         ^ keyword
"                                               ^ string

com -complete=custom,funcName -buffer -addr=tabs -bang ShowFunc execute "echo 'this is another error message'"
" <- keyword
"     ^ property
"               ^ constant
"                   ^ punctuation.delimiter
"                       ^ function
"                                 ^ property
"                                       ^ property
"                                             ^ constant
"                                                 ^ property
"                                                       ^ function.macro
"                                                                   ^ keyword
"                                                                             ^ string
