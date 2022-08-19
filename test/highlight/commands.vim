" Last Change: 2022 Aug 19

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
