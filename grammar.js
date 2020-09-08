const PREC = {
  call: 20,

  OR: 1, //=> or
  AND: 2, //=> and
  COMPARE: 3, //=> < <= == ~= >= >
  BIT_OR: 4, //=> |
  BIT_NOT: 5, //=> ~
  BIT_AND: 6, //=> &
  SHIFT: 7, //=> << >>
  CONCAT: 8, //=> ..
  PLUS: 9, //=> + -
  MULTI: 10, //=> * / // %
  UNARY: 11, //=> not # - ~
  POWER: 12, //=> ^
};

module.exports = grammar({
  name: 'vim',

  word: ($) => $.identifier,

  rules: {
    script_file: ($) => repeat($._statement),

    _cmd_separator: ($) => choice('\n', '|', $.comment),

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
        // $.set_statement,
        // $.return_statement,
        // $.while_loop,
        // $.for_loop,
        // $.if_statement,
        // $.execute_statement,
        $.call_statement,
        $.echo_statement,
        // $.try_statement,
        $.command,
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

        repeat($._statement),

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

    _expression: ($) =>
      choice($._variable, $.index_expression, $.binary_expression),

    // Shamelessly stolen from tree-sitter-lua
    match_case: ($) => choice('#', '?'),

    binary_expression: ($) =>
      choice(
        ...[
          ['||', PREC.OR],
          ['&&', PREC.AND],
          ['|', PREC.BIT_OR],
          ['~', PREC.BIT_NOT],
          ['&', PREC.BIT_AND],
          ['<<', PREC.SHIFT],
          ['>>', PREC.SHIFT],
          ['+', PREC.PLUS],
          ['-', PREC.PLUS],
          ['*', PREC.MULTI],
          ['/', PREC.MULTI],
          ['//', PREC.MULTI],
          ['%', PREC.MULTI],
        ].map(([operator, precedence]) =>
          prec.left(precedence, seq($._expression, operator, $._expression)),
        ),
        ...['==', '!=', '>', '>=', '<', '<=', '=~', '!~'].map((operator) =>
          prec.left(
            PREC.COMPARE,
            seq(
              field('left', $._expression),
              operator,
              optional($.match_case),
              field('right', $._expression),
            ),
          ),
        ),
        ...[
          ['..', PREC.CONCAT],
          ['^', PREC.POWER],
        ].map(([operator, precedence]) =>
          prec.right(precedence, seq($._expression, operator, $._expression)),
        ),
      ),

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
        PREC.call,
        seq(
          field('value', $._expression),
          '[',
          field('index', $._expression),
          ']',
        ),
      ),

    env_variable: ($) => seq('$', $._ident),
    register: ($) => seq('@', $._ident),
    option: ($) => seq('&', $._ident),

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
  return choice('end', 'end' + cmd_name);
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
