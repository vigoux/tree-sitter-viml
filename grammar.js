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

  externals: ($) => [$._no, $._inv, $._cmd_separator, $._line_continuation],

  extras: ($) => [$._cmd_separator, $._line_continuation, /[\t ]/, $.comment],

  rules: {
    script_file: ($) => repeat($._statement),

    comment: ($) =>
      seq(
        '"', // I don't want to include that " so that we can easily parse the comment content
        /.*/,
      ),

    _statement: ($) =>
      choice(
        $.function_definition,
        $.let_statement,
        $.unlet_statement,
        $.set_statement,
        $.return_statement,
        $.while_loop,
        $.for_loop,
        $.if_statement,
        // $.execute_statement,
        $.call_statement,
        $.echo_statement,
        $.try_statement,
        $.command,
      ),

    return_statement: ($) => seq('return', $._expression),

    for_loop: ($) =>
      seq(
        'for',
        field('variable', choice($._ident, $.list)),
        'in',
        field('iter', $._expression),
        alias(repeat($._statement), $.body),
        end('for'),
      ),

    while_loop: ($) => seq(
      "while",
      field("condition", $._expression),
      alias(repeat($._statement), $.body),
      end("while")
    ),

    if_statement: ($) => seq(
      "if",
      field("condition", $._expression),
      alias(repeat($._statement), $.body),
      repeat($.elseif_statement),
      optional($.else_statement),
      end("if")
    ),

    elseif_statement: ($) => seq(
      "elseif",
      field("condition", $._expression),
      alias(repeat($._statement), $.body)
    ),

    else_statement: ($) => seq(
      "else",
      alias(repeat($._statement), $.body)
    ),

    pattern: ($) => /\/.*\//,

    try_statement: ($) => seq(
      "try",
      alias(repeat($._statement), $.body),
      repeat($.catch_statement),
      optional($.finally_statement),
      end("try")
    ),

    catch_statement: ($) => seq(
      "catch",
      optional($.pattern),
      alias(repeat($._statement), $.body)
    ),

    finally_statement: ($) => seq(
      "finally",
      alias(repeat($._statement), $.body)
    ),

    scoped_identifier: ($) => seq($.scope, ':', $.identifier),

    identifier: ($) => /[a-zA-Z_]\w*/,

    _ident: ($) => choice($.scoped_identifier, $.identifier),

    // TODO(vigoux): maybe we should find some names here
    scope: ($) => choice('a', 'b', 's', 't', 'v', 'w'),

    _let_operator: ($) => choice('=', '+=', '-=', '*=', '/=', '%=', '.='),

    let_statement: ($) =>
      seq(
        'let',
        choice(
          $.identifier,
          $.scoped_identifier,
          $.env_variable,
          $.register,
          $.option,
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

    set_statement: ($) =>
      seq(
        'set',
        field('option', $._set_option),
        optional(field('value', $._set_rhs)),
      ),

    unlet_statement: ($) =>
      seq(maybe_bang($, 'unlet'), $._ident, $._cmd_separator),

    call_statement: ($) => seq('call', $.function_call, $._cmd_separator),

    echo_statement: ($) => seq('echo', repeat($._variable), $._cmd_separator),

    return_statement: ($) => seq('return', $._variable, $._cmd_separator),

    command: ($) =>
      seq(
        alias($.identifier, $.command_name),
        alias(repeat($.identifier), $.arguments),
        $._cmd_separator,
      ),

    function_definition: ($) =>
      seq(
        maybe_bang($, 'function'),
        $.function_declaration,
        $._cmd_separator,

        alias(repeat($._statement), $.body),

        end('function'),
        $._cmd_separator,
      ),

    function_declaration: ($) =>
      seq(field('name', $._ident), field('parameters', $.parameters)),

    function_call: ($) =>
      seq(
        field('function', $._ident),
        field('arguments', alias($.parameters, $.arguments)),
      ),

    parameters: ($) => seq('(', commaSep($.identifier), ')'),

    bang: ($) => '!',

    // :h variable
    _variable: ($) =>
      prec.left(
        0,
        choice(
          $._ident,
          $.string_literal,
          $.float_literal,
          $.integer_literal,
          $.list,
          $.function_call,
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

    string_literal: ($) => choice(/".*"/, /'.*'/),

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
          field('start', $._expression),
          ':',
          field('stop', $._expression),
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
          field('function', $._expression),
          '(',
          alias(commaSep($._expression), $.arguments),
          ')',
        ),
      ),

    env_variable: ($) => seq('$', $._ident),
    register: ($) => seq('@', $._ident),
    option: ($) => seq('&', $.option_name),

    dictionnary_entry: ($) =>
      seq(field('key', $._expression), ':', field('value', $._expression)),

    dictionnary: ($) => seq('{', commaSep($.dictionnary_entry), '}'),

    // :h lambda
    lambda_expression: ($) =>
      seq('{', commaSep($.identifier), '->', $._expression, '}'),
  },
});

function maybe_bang($, cmd_name) {
  return seq(cmd_name, optional($.bang));
}

function end(cmd_name) {
  // choice('end', 'endf', 'endfu', ..)
  var list = [];
  var current_preffix = 'end';

  list.push(current_preffix);

  for (const c of cmd_name) {
    current_preffix += c;
    list.push(current_preffix);
  }

  return choice(...list);
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
