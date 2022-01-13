/// <reference types="tree-sitter-cli/dsl" />

const MAP_OPTIONS = any_order(
  '<buffer>',
  '<nowait>',
  '<silent>',
  '<unique>',
  '<script>',
);

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
    $._separator_first,
    $._separator,
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
    $._map,
    $._nmap,
    $._vmap,
    $._xmap,
    $._smap,
    $._omap,
    $._imap,
    $._lmap,
    $._cmap,
    $._tmap,
    $._noremap,
    $._vnoremap,
    $._nnoremap,
    $._xnoremap,
    $._snoremap,
    $._onoremap,
    $._inoremap,
    $._lnoremap,
    $._cnoremap,
    $._tnoremap,
    $._augroup,
    $._highlight,
    $._syntax,
    $._set,
    $._setlocal,
    $._startinsert,
    $._stopinsert,
    $._global,
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
        $.setlocal_statement,
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
        $.echomsg_statement,
        $.try_statement,
        $.throw_statement,
        $.autocmd_statement,
        $.silent_statement,
        $.register_statement,
        $.map_statement,
        $.augroup_statement,
        $.highlight_statement,
        $.syntax_statement,
        $.startinsert_statement,
        $.stopinsert_statement,
        $.user_command,
        $.global_statement,
      ),

    return_statement: ($) =>
      seq(tokalias($, 'return'), optional($._expression), $._cmd_separator),

    normal_statement: ($) => command($, 'normal', alias(/.*/, $.commands)),
    startinsert_statement: ($) => seq(maybe_bang($, tokalias($, 'startinsert')), $._cmd_separator),
    stopinsert_statement: ($) => seq(tokalias($, 'stopinsert'), $._cmd_separator),

    global_statement: ($) => seq(
      maybe_bang($, tokalias($, 'global')),
      $._separator_first, /[a-zA-A]*/, $._separator,
      $._statement),

    lua_statement: ($) => seq('lua', choice($.chunk, $.script)),
    ruby_statement: ($) => seq(tokalias($, 'ruby'), choice($.chunk, $.script)),
    python_statement: ($) =>
      seq(tokalias($, 'python'), choice($.chunk, $.script)),
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
        tokalias($, 'endfor'),
        $._cmd_separator,
      ),

    while_loop: ($) =>
      seq(
        'while',
        field('condition', $._expression),
        $._cmd_separator,
        alias(repeat($._statement), $.body),
        tokalias($, 'endwhile'),
        $._cmd_separator,
      ),

    if_statement: ($) =>
      seq(
        'if',
        field('condition', $._expression),
        $._cmd_separator,
        alias(repeat($._statement), $.body),
        repeat($.elseif_statement),
        optional($.else_statement),
        tokalias($, 'endif'),
        $._cmd_separator,
      ),

    elseif_statement: ($) =>
      seq(
        'elseif',
        field('condition', $._expression),
        alias(repeat($._statement), $.body),
      ),

    else_statement: ($) => seq('else', alias(repeat($._statement), $.body)),

    try_statement: ($) =>
      seq(
        'try',
        $._cmd_separator,
        alias(repeat($._statement), $.body),
        repeat($.catch_statement),
        optional($.finally_statement),
        tokalias($, 'endtry'),
        $._cmd_separator,
      ),

    _au_pattern: ($) => choice(/\/.*\//, /\?.*\?/),

    catch_statement: ($) =>
      seq(
        'catch',
        optional(alias($._au_pattern, $.pattern)),
        $._cmd_separator,
        alias(repeat($._statement), $.body),
      ),

    finally_statement: ($) =>
      seq('finally', alias(repeat($._statement), $.body)),

    throw_statement: ($) =>
      seq(tokalias($, 'throw'), $._expression, $._cmd_separator),

    autocmd_statement: ($) =>
      seq(
        maybe_bang($, tokalias($, 'autocmd')),
        optional(
          seq(
            $.au_event_list,
            commaSep1(alias(/[^ \t\n,]+/, $.pattern)),
            optional('++once'),
            optional('++nested'),
            field('command', $._statement),
          ),
        ),
      ),

    augroup_statement: ($) =>
      seq(
        maybe_bang($, tokalias($, 'augroup')),
        alias($.identifier, $.augroup_name),
        $._cmd_separator,
      ),

    au_event: ($) => /[A-Z][a-zA-Z]+/,
    au_event_list: ($) => commaSep1($.au_event),

    // TODO(vigoux): maybe we should find some names here
    scoped_identifier: ($) => seq($.scope, $.identifier),

    argument: ($) => seq('a:', choice($.identifier, $.integer_literal)),

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
          $.list,
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

    _set_operator: ($) =>
      choice(...['=', ':', '+=', '^=', '-='].map(token.immediate)),

    set_value: ($) => token.immediate(/([^ \n\t]|\\[\t ])+/),

    _set_rhs: ($) =>
      seq($._set_operator, optional(field('value', $.set_value))),

    set_item: ($) => seq(field('option', $._set_option), optional($._set_rhs)),

    set_statement: ($) => set_variant($, 'set'),
    setlocal_statement: ($) => set_variant($, 'setlocal'),

    unlet_statement: ($) =>
      seq(maybe_bang($, 'unlet'), repeat1($._expression), $._cmd_separator),

    call_statement: ($) => seq('call', $.call_expression, $._cmd_separator),

    echo_statement: ($) => echo_variant($, 'echo'),
    echomsg_statement: ($) => echo_variant($, 'echomsg'),

    execute_statement: ($) =>
      seq(tokalias($, 'execute'), repeat1($._expression), $._cmd_separator),

    silent_statement: ($) =>
      seq(maybe_bang($, tokalias($, 'silent')), $._statement),

    user_command: ($) =>
      seq(
        maybe_bang($, alias(/[A-Z][A-Za-z0-9]*/, $.command_name)),
        alias(repeat($.command_argument), $.arguments),
        $._cmd_separator,
      ),

    command_argument: ($) => choice($.string_literal, /\S+/),

    function_definition: ($) =>
      seq(
        maybe_bang($, tokalias($, 'function')),
        $.function_declaration,
        any_order('dict', 'range', 'abort', 'closure'),
        $._cmd_separator,

        alias(repeat($._statement), $.body),

        tokalias($, 'endfunction'),
        $._cmd_separator,
      ),

    function_declaration: ($) =>
      seq(field('name', $._ident), field('parameters', $.parameters)),

    // FIXME(vigoux): The spread here is not exactly right...
    parameters: ($) => seq('(', commaSep(choice($.identifier, $.spread)), ')'),

    bang: ($) => '!',

    spread: ($) => '...',

    // :h Pattern
    range_pattern: ($) => choice(/\/[^,\n]+\/?/, /\?[^,\n]+\??/),

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
        $.integer_literal,
        $.current_line,
        $.next_line,
        $.last_line,
        $.range_pattern,
        $.previous_pattern,
        $.mark,
      ),

    current_line: ($) => '.',
    next_line: ($) => '+',
    last_line: ($) => '$',
    previous_pattern: ($) => choice('\\/', '\\?', '\\&'),

    // :h :@
    register_statement: ($) => $.register,

    map_statement: ($) =>
      seq(
        field(
          'cmd',
          choice(
            ...[
              'map',
              'nmap',
              'vmap',
              'xmap',
              'smap',
              'omap',
              'imap',
              'lmap',
              'cmap',
              'tmap',
              'noremap',
              'vnoremap',
              'nnoremap',
              'xnoremap',
              'snoremap',
              'onoremap',
              'inoremap',
              'lnoremap',
              'cnoremap',
              'tnoremap',
            ].map((name) => tokalias($, name)),
          ),
        ),
        MAP_OPTIONS,
        $._map_definition,
        $._cmd_separator,
      ),

    _map_definition: ($) =>
      choice(
        seq(
          '<expr>',
          MAP_OPTIONS,
          field('lhs', alias($._map_lhs, $.map_side)),
          field('rhs', $._expression),
        ),
        seq(
          field('lhs', alias($._map_lhs, $.map_side)),
          field('rhs', alias($._map_rhs, $.map_side)),
        ),
      ),

    _keycode_in: ($) => seq(token.immediate(/C-\S/), token.immediate('>')),

    _immediate_keycode: ($) =>
      alias(seq(token.immediate('<'), $._keycode_in), $.keycode),
    keycode: ($) => seq('<', $._keycode_in),

    _map_lhs: ($) => keys($, /[^\n ]+/),
    _map_rhs: ($) => keys($, /[^\s|]([^|\n]|\\\|)*/),

    // :h :highlight

    hl_group: ($) => /[a-zA-Z0-9_]+/,

    _hl_body_link: ($) => seq(optional('default'), 'link', field('from', $.hl_group), field('to', $.hl_group)),

    _hl_body_clear: ($) => seq('clear', optional($.hl_group)),

    _hl_body_none: ($) => seq($.hl_group, 'NONE'),

    _hl_attr_list: ($) =>
      commaSep1(
        choice(
          ...[
            'bold',
            'underline',
            'undercurl',
            'strikethrough',
            'reverse',
            'inverse',
            'italic',
            'standout',
            'nocombine',
            'NONE',
          ].map(token.immediate),
        ),
      ),

    _hl_key_cterm: ($) => hl_key_val('cterm', $._hl_attr_list),

    _hl_term_list: ($) =>
      repeat1(choice(token.immediate(/\S+/), $._immediate_keycode)),
    _hl_key_start_stop: ($) =>
      hl_key_val(choice('start', 'stop'), $._hl_term_list),

    _hl_color_nr: ($) => token.immediate(/[0-9]+\*?/),
    _hl_key_ctermfg_ctermbg: ($) =>
      hl_key_val(
        choice('ctermfg', 'ctermbg'),
        choice($._hl_color_name, $._hl_color_nr),
      ),

    _hl_key_gui: ($) => hl_key_val('gui', $._hl_attr_list),

    _hl_quoted_name: ($) =>
      seq(token.immediate("'"), token.immediate(/[^'\n]+/), "'"),

    _hl_color_name: ($) =>
      choice(
        $._hl_quoted_name,
        ...[
          'NONE',
          'bg',
          'background',
          'fg',
          'foreground',
          /#[0-9a-fA-F]{6}/,
          /[a-zA-Z]+/,
        ].map(token.immediate),
      ),
    _hl_key_gui_color: ($) =>
      hl_key_val(choice('guifg', 'guibg', 'guisp'), $._hl_color_name),

    _hl_key_font: ($) =>
      hl_key_val(
        'font',
        choice(token.immediate(/[a-zA-Z0-9-]+/), $._hl_quoted_name),
      ),

    hl_attribute: ($) =>
      choice(
        $._hl_key_cterm,
        $._hl_key_start_stop,
        $._hl_key_ctermfg_ctermbg,
        $._hl_key_gui,
        $._hl_key_gui_color,
        $._hl_key_font,
      ),

    _hl_body_keys: ($) =>
      seq(optional('default'), $.hl_group, repeat1($.hl_attribute)),

    _hl_body: ($) => choice($._hl_body_clear, $._hl_body_none, $._hl_body_keys, $._hl_body_link),

    highlight_statement: ($) =>
      seq(
        maybe_bang($, tokalias($, 'highlight')),
        optional($._hl_body),
        $._cmd_separator,
      ),

    // :h :syntax
    _syn_enable: ($) => syn_sub(choice('enable', 'on', 'off', 'reset')),

    _syn_case: ($) => syn_sub('case', optional(choice('match', 'ignore'))),

    _syn_spell: ($) =>
      syn_sub('spell', optional(choice('toplevel', 'notoplevel', 'default'))),

    _syn_foldlevel: ($) =>
      syn_sub('foldlevel', optional(choice('start', 'minimum'))),

    _syn_iskeyword: ($) =>
      syn_sub('iskeyword', optional(choice('clear', alias(/[^ \n]+/, $.value)))),

    // :h :syn-arguments

    _syn_hl_pattern: ($) =>
        seq('\'', $.pattern, '\''),

    // FIXME: find better names for rules (_syn_arguments_[basic|match|region])
    _syn_arguments_keyword: ($) =>
      choice(
        syn_arg('conceal'),
        // FIXME: check for what is exactly a control character in viml
        syn_arg('cchar', optional(token.immediate(/[^\t\n\v\f\r]/))),
        syn_arg('contained'),
        // FIXME: allow regex of hlgroups for `containedin` and nextgroup
        syn_arg('containedin', commaSep($.hl_group)),
        syn_arg('nextgroup', commaSep($.hl_group)),
        syn_arg('transparent'),
        syn_arg('skipwhite'),
        syn_arg('skipnl'),
        syn_arg('skipempty'),
      ),

    _syn_arguments_match: ($) =>
      choice(
        $._syn_arguments_keyword,
        syn_arg('contains', commaSep($.hl_group)),
        syn_arg('fold'),
        syn_arg('display'),
        syn_arg('extend'),
        syn_arg('keepend'),
        syn_arg('excludenl'),
      ),

    _syn_arguments_region: ($) =>
      choice(
        $._syn_arguments_match,
        syn_arg('oneline'),
        syn_arg('concealends'),
        syn_arg('extend'),
      ),

    _syn_pattern_offset: ($) =>
      seq(
        field(
          'what',
          choice(
            ...[
              'ms',
              'me',
              'hs',
              'he',
              'rs',
              're',
              'lc',
            ].map(token.immediate),
          ),
        ),
        token.immediate('='),
        field(
          'offset',
          choice(
            ...[
              /[se]([+-][0-9]+)?/,
              /[0-9]/,
            ].map(token.immediate),
          ),
        ),
      ),

    _syn_keyword: ($) =>
      syn_sub(
        'keyword',
        $.hl_group,
        repeat(alias($._syn_arguments_keyword, $.syntax_argument)),
        // The list of keyword cannot be empty, but we can have arguments anywhere on the line
        alias(/[a-zA-Z\[\]]+/, $.keyword),
        repeat(choice(
          alias($._syn_arguments_keyword, $.syntax_argument),
          alias(/[a-zA-Z\[\]]+/, $.keyword),
        )),
      ),

    _syn_match: ($) =>
      syn_sub(
        'match',
        $.hl_group,
        repeat(alias($._syn_arguments_match, $.syntax_argument)),
        $._syn_hl_pattern,
        commaSep(alias($._syn_pattern_offset, $.pattern_offset)),
        repeat(alias($._syn_arguments_match, $.syntax_argument)),
      ),

    syntax_statement: ($) =>
      seq(
        tokalias($, 'syntax'),
        choice(
          $._syn_enable,
          $._syn_case,
          $._syn_spell,
          $._syn_foldlevel,
          $._syn_iskeyword,
          $._syn_keyword,
          $._syn_match,
        ),
        $._cmd_separator
      ),

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

    list: ($) => seq('[', commaSep($._expression), optional(','), ']'),

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
        seq(
          field('value', $._expression),
          token.immediate('.'),
          field('field', $._expression),
        ),
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

    // :h pattern
    pattern_multi: ($) =>
      choice(
        '*',
        /\\[+=?]/,
        /\\@[!>=]|<[=!]/,
        /\\\{-?[0-9]*,?[0-9]*}/,
      ),

    _pattern_ordinary_atom: ($) =>
      repeat1(choice(
        seq(
          '[',
          repeat(choice(
            seq('\\', /./), // escaped character
            /[^\]\n\\]/       // any character besides ']' or '\n'
          )),
          ']'
        ),              // square-bracket-delimited character class
        seq('\\', /./), // escaped character
        // FIXME: makes this stop at the end of the pattern
        /[^'\\\[\n]/    // any character besides '[', '\', ''', '\n'
      )),

    _pattern_atom: ($) =>
        prec.left(choice(
          $._pattern_ordinary_atom,
          seq('\\(', $.pattern, '\\)'),
          seq('\\%(', $.pattern, '\\)'),
          seq('\\z(', $.pattern, '\\)'),
        )),

    _pattern_piece: ($) =>
        seq($._pattern_atom, optional($.pattern_multi)),

    _pattern_concat: ($) =>
        repeat1($._pattern_piece),

    _pattern_branch: ($) =>
        sep1($._pattern_concat, '\\&'),

    pattern: ($) =>
        sep1($._pattern_branch, '\\|'),

    env_variable: ($) => seq('$', $.identifier),

    // :h registers
    register: ($) => /@["0-9a-zA-Z:.%#=*+_/-]/,

    option: ($) => seq('&', optional($.scope), $.option_name),

    dictionnary_entry: ($) =>
      seq(field('key', $._expression), ':', field('value', $._expression)),

    dictionnary: ($) =>
      seq('{', commaSep($.dictionnary_entry), optional(','), '}'),

    // :h lambda
    lambda_expression: ($) =>
      seq('{', commaSep($.identifier), '->', $._expression, '}'),
  },
});

function tokalias(gram, name) {
  return alias(gram['_' + name], name);
}

function command($, cmd, ...args) {
  return seq(
    optional(field('range', alias($._range, $.range))),
    tokalias($, cmd),
    ...args,
  );
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

function set_variant($, cmd) {
  return seq(tokalias($, cmd), sep1($.set_item, ' '), $._cmd_separator);
}

function any_order(...args) {
  return repeat(choice(...args));
}

function hl_key_val(left, right) {
  return seq(field('key', left), token.immediate('='), field('val', right));
}

function syn_sub(sub, ...args) {
  if (args.length > 0) {
    return seq(field('sub', sub), ...args);
  } else {
    return field('sub', sub);
  }
}

function syn_arg(arg, ...args) {
  if (args.length > 0)
    return seq(field('name', arg), token.immediate('='), field('val', ...args));
  else
    return field('name', arg);
}

function keys($, allowed) {
  return seq(
    choice(allowed, $.keycode),
    repeat(choice(token.immediate(allowed), $._immediate_keycode)),
  );
}
