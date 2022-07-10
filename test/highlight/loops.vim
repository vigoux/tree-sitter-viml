" Last Change: 10 July 2022

for i in foo
" <- repeat
"   ^ variable
"     ^^ repeat
"        ^^^ variable
  if i.bar
  " <- conditional
  "  ^ variable
  "   ^ punctuation.delimiter
  "    ^^^ variable
    break
    " <- repeat
  endif
  " <- conditional
  continue
  " <- repeat
endfor
" <- repeat

while v:false
" <- repeat
"     ^^ namespace
"       ^^^^^ variable
endwhile
" <- repeat
