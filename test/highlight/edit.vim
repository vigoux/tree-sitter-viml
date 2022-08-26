edit
" <- keyword

edit!
" <- keyword
"   ^ punctuation.special

edit ++ff=dos + filename.txt
" <- keyword
"    ^^^^ property
"           ^ constant
"             ^ property
"                 ^ string

edit ++bad=A ++nobinary #1
" <- keyword
"       ^ property
"               ^ property
"                        ^ number

ex
" <- keyword

ex ++encoding=latin1 +3 filename
" <- keyword
"     ^ property
"               ^ constant
"                    ^ property
"                     ^ number
"                         ^ string

enew!
" <- keyword
"   ^ punctuation.special

find filename
" <- keyword
"     ^ string

find! ++bad=keep another\ filename
" <- keyword
"   ^ punctuation.special
"       ^ property
"             ^ constant
"                ^^^^^^^^^^^^^^^^^ string

vi
" <- keyword

visual! ++binary
" <- keyword
"     ^ punctuation.special
"         ^ property

visual filename
" <- keyword
"       ^ string

vie +/pattern_to_check_against filename
" <- keyword
"   ^ property
"       ^ string.special
"                               ^ string

view! banged_filename
" <- keyword
"   ^ punctuation.special
"       ^ string
