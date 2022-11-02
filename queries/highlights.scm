;; Function related
(function_declaration name: (_) @function (#set! "priority" 101))
(call_expression function: (identifier) @function (#set! "priority" 101))
(parameters (identifier) @parameter (#set! "priority" 101))
(default_parameter (identifier) @parameter (#set! "priority" 101))

;; Command command

(command) @string

(command_attribute
  name: _ @property
  val: (behavior
    name: _ @constant (#set! "priority" 101)
    val: (identifier)? @function (#set! "priority" 101))?)


((identifier) @constant
 (#match? @constant "^[A-Z][A-Z_0-9]*$")
 (#set! "priority" 101))
(identifier) @variable

;; Keywords

[
  "if"
  "else"
  "elseif"
  "endif"
] @conditional

[
  "try"
  "catch"
  "finally"
  "endtry"
  "throw"
] @exception

[
  "for"
  "endfor"
  "in"
  "while"
  "endwhile"
  "break"
  "continue"
] @repeat

[
  "function"
  "endfunction"
] @keyword.function

[ (bang) (spread) ] @punctuation.special

[ (no_option) (inv_option) (default_option) (option_name) ] @variable.builtin
[
  (scope)
  "a:"
  "$"
] @namespace

;; Commands and user defined commands

[
  "let"
  "unlet"
  "const"
  "call"
  "execute"
  "normal"
  "set"
  "setlocal"
  "silent"
  "echo"
  "echomsg"
  "autocmd"
  "augroup"
  "return"
  "syntax"
  "filetype"
  "source"
  "lua"
  "ruby"
  "perl"
  "python"
  "highlight"
  "command"
  "delcommand"
  "comclear"
  "colorscheme"
  "startinsert"
  "stopinsert"
  "global"
  "runtime"
  "wincmd"
  "cnext"
  "cprevious"
  "cNext"
  "vertical"
  "leftabove"
  "aboveleft"
  "rightbelow"
  "belowright"
  "topleft"
  "botright"
  (unknown_command_name)
  "edit"
  "enew"
  "find"
  "ex"
  "visual"
  "view"
  "eval"
] @keyword
(map_statement cmd: _ @keyword)
(command_name) @function.macro

;; Filetype command

(filetype_statement [
  "detect"
  "plugin"
  "indent"
  "on"
  "off"
] @keyword)

;; Syntax command

(syntax_statement (keyword) @string)
(syntax_statement [
  "enable"
  "on"
  "off"
  "reset"
  "case"
  "spell"
  "foldlevel"
  "iskeyword"
  "keyword"
  "match"
  "cluster"
  "region"
] @keyword)

(syntax_argument name: _ @keyword)

[
  "<buffer>"
  "<nowait>"
  "<silent>"
  "<script>"
  "<expr>"
  "<unique>"
] @constant.builtin

(augroup_name) @namespace

(au_event) @constant
(normal_statement (commands) @constant)

;; Highlight command

(hl_attribute
  key: _ @property
  val: _ @constant)

(hl_group) @type

(highlight_statement [
  "default"
  "link"
  "clear"
] @keyword)

;; Edit command
(plus_plus_opt
  val: _? @constant) @property
(plus_cmd "+" @property) @property

;; Runtime command

(runtime_statement (where) @keyword.operator)

;; Colorscheme command

(colorscheme_statement (name) @string)

;; Literals

(string_literal) @string
(integer_literal) @number
(float_literal) @float
(comment) @comment @spell
(line_continuation_comment) @comment @spell
(pattern) @string.special
(pattern_multi) @string.regex
(filename) @string
(heredoc (body) @string)
((heredoc (parameter) @keyword))
((scoped_identifier
  (scope) @_scope . (identifier) @boolean)
 (#eq? @_scope "v:")
 (#any-of? @boolean "true" "false"))

;; Operators

[
  "||"
  "&&"
  "&"
  "+"
  "-"
  "*"
  "/"
  "%"
  ".."
  "is"
  "isnot"
  "=="
  "!="
  ">"
  ">="
  "<"
  "<="
  "=~"
  "!~"
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  ".="
  "..="
] @operator

; Some characters have different meanings based on the context
(unary_operation "!" @operator)
(binary_operation "." @operator)

;; Punctuation

[
  "("
  ")"
  "{"
  "}"
  "["
  "]"
] @punctuation.bracket

(field_expression "." @punctuation.delimiter)

[
  ","
  ":"
] @punctuation.delimiter

(ternary_expression ["?" ":"] @conditional)

; Options
((set_value) @number
 (#match? @number "^[0-9]+(\.[0-9]+)?$"))

(inv_option "!" @operator)
(set_item "?" @operator)

((set_item
   option: (option_name) @_option
   value: (set_value) @function)
  (#any-of? @_option
    "tagfunc" "tfu"
    "completefunc" "cfu"
    "omnifunc" "ofu"
    "operatorfunc" "opfunc"))
