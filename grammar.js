const PREC = {
  call: 20,
};

module.exports = grammar({
  name: 'VimL',

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

    let_statement: ($) =>
      seq('let', $._ident, '=', $._expression, $._cmd_separator),

    unlet_statement: ($) =>
      seq(maybe_bang($, 'unlet'), $._ident, $._cmd_separator),

    call_statement: ($) => seq('call', $.function_call, $._cmd_separator),

    echo_statement: ($) => seq('echo', repeat($._expression), $._cmd_separator),

    return_statement: ($) => seq('return', $._expression, $._cmd_separator),

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
    _expression: ($) =>
      choice(
        $._ident,
        $.string_literal,
        $.float_literal,
        $.integer_literal,
        $.list,
        $.function_call,
        $.index_expression,
        // $.env_variable,
        // $.register,
        // $.option,
        $.lambda_expression,
        // $.dictionnary
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
