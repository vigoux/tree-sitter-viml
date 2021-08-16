/// <reference types="tree-sitter-cli/dsl" />

PREC = {
  TERNARY: 1, //=> expr ? expr : expr
  OR: 2, //=> or
  AND: 3, //=> and
  COMPARE: 4, //=> < <= == ~= >= > and all
  PLUS: 5, //=> + -
  CONCAT: 5, //=> .. .
  MULTI: 6, //=> * / %
  UNARY: 7, //=> ! - +
  CALL: 8, //expr[n] expr[n:m] expr.name expr(...)
};

module.exports = grammar({
  name: 'vim',

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.binary_operation, $.unary_operation, $.field_expression],
    [$.binary_operation, $.field_expression],
  ],

  externals: ($) => [
    $._no,
    $._inv,
    $._cmd_separator,
    $._line_continuation,
    $._embedded_script_start,
    $._embedded_script_end,
    $.scope_dict,
    $.scope,
    $.string_literal,
    $.comment,
    $._function,
    $._endfunction,
    $._endfor,
    $._endwhile,
    $._endif,
    $._endtry,
    $._normal,
    $._return,
    $._ruby,
    $._python,
    $._throw,
    $._execute,
    $._autocmd,
    $._silent,
    $._echo,
    $._echomsg,
  ],

  extras: ($) => [$._cmd_separator, $._line_continuation, /[\t ]/, $.comment],

  rules: {
    script_file: ($) => repeat($._statement),

    _statement: ($) =>
      choice(
        $.function_definition,
        $.let_statement,
        $.unlet_statement,
        $.set_statement,
        $.return_statement,
        $.normal_statement,
        $.while_loop,
        $.for_loop,
        $.if_statement,
        $.lua_statement,
        $.range_statement,
        $.ruby_statement,
        $.python_statement,
        $.perl_statement,
        $.call_statement,
        $.execute_statement,
        $.echo_statement,
        $.try_statement,
        $.throw_statement,
        $.autocmd_statement,
        $.silent_statement,
        $.register_statement,
        $.command,
      ),

    return_statement: ($) => seq(tokalias($, 'return'), optional($._expression), $._cmd_separator),

    normal_statement: ($) => command($, "normal", alias(/.*/, $.commands)),

    lua_statement: ($) => seq('lua', choice($.chunk, $.script)),
    ruby_statement: ($) => seq(tokalias($, 'ruby'), choice($.chunk, $.script)),
    python_statement: ($) => seq(tokalias($, 'python'), choice($.chunk, $.script)),
    perl_statement: ($) => seq('perl', choice($.chunk, $.script)),

    chunk: ($) => seq(/[^\n]*/, $._cmd_separator),

    script: ($) =>
      seq(
        $._embedded_script_start,
        $._cmd_separator,
        repeat(alias($.chunk, $.line)),
        $._embedded_script_end,
        $._cmd_separator,
      ),

    for_loop: ($) =>
      seq(
        'for',
        field('variable', choice($._ident, $.list)),
        'in',
        field('iter', $._expression),
        alias(repeat($._statement), $.body),
        tokalias($, "endfor"), $._cmd_separator,
      ),

    while_loop: ($) =>
      seq(
        'while',
        field('condition', $._expression),
        alias(repeat($._statement), $.body),
        tokalias($, "endwhile"), $._cmd_separator,
      ),

    if_statement: ($) =>
      seq(
        'if',
        field('condition', $._expression),
        $._cmd_separator,
        alias(repeat($._statement), $.body),
        repeat($.elseif_statement),
        optional($.else_statement),
        tokalias($, "endif"), $._cmd_separator,
      ),

    elseif_statement: ($) =>
      seq(
        'elseif',
        field('condition', $._expression),
        alias(repeat($._statement), $.body),
      ),

    else_statement: ($) => seq('else', alias(repeat($._statement), $.body)),

    pattern: ($) => choice(/\/.*\//, /\?.*\?/),

    try_statement: ($) =>
      seq(
        'try', $._cmd_separator,
        alias(repeat($._statement), $.body),
        repeat($.catch_statement),
        optional($.finally_statement),
        tokalias($, "endtry"), $._cmd_separator,
      ),

    catch_statement: ($) =>
      seq('catch', optional($.pattern), $._cmd_separator, alias(repeat($._statement), $.body)),

    finally_statement: ($) =>
      seq('finally', alias(repeat($._statement), $.body)),

    throw_statement: ($) => seq(tokalias($, "throw"), $._expression, $._cmd_separator),

    autocmd_statement: ($) => seq(
      tokalias($, "autocmd"),
      $.au_event_list,
      alias(/[a-zA-Z*.]+/, $.pattern),
      optional("++once"),
      optional("++nested"),
      field("command", $._statement)
    ),

    au_event: ($) => /[A-Z][a-zA-Z]+/,
    au_event_list: ($) => commaSep1($.au_event),

    // TODO(vigoux): maybe we should find some names here
    scoped_identifier: ($) => seq($.scope, $.identifier),

    argument: ($) => seq( 'a:', choice($.identifier, $.integer_literal)),

    identifier: ($) => /[a-zA-Z_](\w|#)*/,

    _ident: ($) => choice($.scoped_identifier, $.identifier, $.argument),

    _let_operator: ($) => choice('=', '+=', '-=', '*=', '/=', '%=', '.='),

    let_statement: ($) =>
      seq(
        'let',
        choice(
          $._ident,
          $.env_variable,
          $.register,
          $.option,
          $.index_expression,
          $.field_expression,
          $.list
        ),
        $._let_operator,
        $._expression,
        $._cmd_separator,
      ),

    option_name: ($) => /[a-z]+/,

    no_option: ($) => seq($._no, $.option_name),

    inv_option: ($) => seq($._inv, $.option_name),

    default_option: ($) =>
      seq($.option_name, '&', optional(choice('vi', 'vim'))),

    _set_option: ($) =>
      choice(
        'all',
        'all&',
        $.option_name,
        seq($.option_name, '?'),
        $.no_option,
        $.inv_option,
        $.default_option,
      ),

    _set_operator: ($) => choice('=', ':', '+=', '^=', '-='),

    set_value: ($) => /(\S|\\\s)*/,

    _set_rhs: ($) => seq($._set_operator, $.set_value),

    set_item: ($) => seq(
        field('option', $._set_option),
        optional(field('value', $._set_rhs)),
    ),

    set_statement: ($) =>
      seq(
        'set',
        repeat($.set_item),
        $._cmd_separator
      ),

    unlet_statement: ($) =>
      seq(maybe_bang($, 'unlet'), repeat1($._expression), $._cmd_separator),

    call_statement: ($) => seq('call', $.call_expression, $._cmd_separator),

    echo_statement: ($) => echo_variant($, 'echo'),
    echomsg_statement: ($) => echo_variant($, 'echomsg'),

    execute_statement: ($) => seq(tokalias($, "execute"), repeat1($._expression), $._cmd_separator),

    silent_statement: ($) => seq(
      maybe_bang($, tokalias($, "silent")),
      $._statement
    ),

    command: ($) =>
      seq(
        maybe_bang($, alias($.identifier, $.command_name)),
        alias(repeat($.command_argument), $.arguments),
        $._cmd_separator,
      ),

    command_argument: ($) => /\S+/,

    function_definition: ($) =>
      seq(
        maybe_bang($, tokalias($, 'function')),
        $.function_declaration,
        repeat(choice('dict', 'range', 'abort', 'closure')),
        $._cmd_separator,

        alias(repeat($._statement), $.body),

        tokalias($, "endfunction"),
        $._cmd_separator,
      ),

    function_declaration: ($) => seq(
        field('name', $._ident),
        field('parameters', $.parameters)),

    // FIXME(vigoux): The spread here is not exactly right...
    parameters: ($) => seq('(', commaSep(choice($.identifier, $.spread)), ')'),

    bang: ($) => '!',

    spread: ($) => '...',

    // :h 10.3

    mark: ($) => /'./,

    range_statement: ($) => seq($._range, $._cmd_separator),

    _range: ($) => choice(alias('%', $.file), $._range_explicit),

    _range_explicit: ($) =>
      seq(
        field('start', $._range_marker),
        optional(seq(',', field('end', $._range_marker))),
      ),

    _range_marker: ($) =>
      choice(
        alias($.integer_literal, $.line_number),
        $.current_line,
        $.next_line,
        $.last_line,
        $.pattern,
        $.previous_pattern,
        $.mark
      ),

    current_line: ($) => '.',
    next_line: ($) => '+',
    last_line: ($) => '$',
    previous_pattern: ($) => choice('\\/', '\\?', '\\&'),

    // :h :@
    register_statement: ($) => $.register,

    // :h variable
    _variable: ($) =>
      prec.left(
        0,
        choice(
          $.scope_dict,
          $._ident,
          $.string_literal,
          $.float_literal,
          $.integer_literal,
          $.list,
          $.env_variable,
          $.register,
          $.option,
          $.lambda_expression,
          $.dictionnary,
        ),
      ),

    //:h expression-syntax
    _expression: ($) =>
      choice(
        $._variable,
        $.ternary_expression,
        $.index_expression,
        $.slice_expression,
        $.binary_operation,
        seq('(', $._expression, ')'),
        $.unary_operation,
        $.field_expression,
        $.call_expression,
      ),

    ternary_expression: ($) =>
      prec.left(
        PREC.TERNARY,
        seq(
          field('condition', $._expression),
          '?',
          field('left', $._expression),
          ':',
          field('right', $._expression),
        ),
      ),

    // Shamelessly stolen from tree-sitter-lua
    match_case: ($) => choice('#', '?'),

    binary_operation: ($) =>
      choice(
        ...[
          ['||', PREC.OR],
          ['&&', PREC.AND],
          ['+', PREC.PLUS],
          ['-', PREC.PLUS],
          ['*', PREC.MULTI],
          ['/', PREC.MULTI],
          ['%', PREC.MULTI],
          ['..', PREC.CONCAT],
          ['.', PREC.CONCAT],
          ['is', PREC.COMPARE],
          ['isnot', PREC.COMPARE],
        ].map(([operator, precedence]) =>
          prec.left(
            precedence,
            bin_left_right($._expression, operator, $._expression),
          ),
        ),
        ...['==', '!=', '>', '>=', '<', '<=', '=~', '!~'].map((operator) =>
          prec.left(
            PREC.COMPARE,
            bin_left_right(
              $._expression,
              seq(operator, optional($.match_case)),
              $._expression,
            ),
          ),
        ),
      ),

    unary_operation: ($) =>
      prec.left(PREC.UNARY, seq(choice('-', '!', '+'), $._expression)),

    // :h floating-point-format
    float_literal: ($) => {
      const digits = /[0-9]+/;
      const sign = /[+-]?/;

      return token(
        seq(sign, digits, '.', digits, optional(seq(/[eE]/, sign, digits))),
      );
    },

    integer_literal: ($) =>
      token(
        seq(
          optional(/[-+]/),
          choice(
            seq(choice('0x', '0X'), /[A-Fa-f0-9]+/),
            seq(choice('0', '0'), /[0-7]+/),
            seq(choice('0b', '0B'), /[0-1]+/),
            /[0-9]+/,
          ),
        ),
      ),

    list: ($) => seq('[', commaSep($._expression), ']'),

    index_expression: ($) =>
      prec(
        PREC.CALL,
        seq(
          field('value', $._expression),
          '[',
          field('index', $._expression),
          ']',
        ),
      ),

    slice_expression: ($) =>
      prec(
        PREC.CALL,
        seq(
          field('value', $._expression),
          '[',
          optional(field('start', $._expression)),
          ':',
          optional(field('stop', $._expression)),
          ']',
        ),
      ),

    field_expression: ($) =>
      prec.left(
        PREC.CALL,
        seq(field('value', $._expression), '.', field('field', $._expression)),
      ),

    call_expression: ($) =>
      prec(
        PREC.CALL,
        seq(
          field('function', $._ident),
          '(',
          optional(commaSep1($._expression)),
          ')',
        ),
      ),

    env_variable: ($) => seq('$', $.identifier),

    // :h registers
    register: ($) => /@["0-9a-zA-Z:.%#=*+_/-]/,

    option: ($) => seq('&', $.option_name),

    dictionnary_entry: ($) =>
      seq(field('key', $._expression), ':', field('value', $._expression)),

    dictionnary: ($) => seq('{', commaSep($.dictionnary_entry), optional(','), '}'),

    // :h lambda
    lambda_expression: ($) =>
      seq('{', commaSep($.identifier), '->', $._expression, '}'),
  },
});

function tokalias(gram, name) {
  return alias(gram["_" + name], name);
}

function command($, cmd, ...args) {
  return seq(optional(field('range', alias($._range, $.range))), tokalias($, cmd), ...args);
}

function maybe_bang($, cmd_name) {
  return seq(cmd_name, optional($.bang));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return sep1(rule, ',');
}

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

function bin_left_right(left, operator, right) {
  return seq(field('left', left), operator, field('right', right));
}

function echo_variant($, cmd) {
    return seq(tokalias($, cmd), repeat($._expression), $._cmd_separator);
}
