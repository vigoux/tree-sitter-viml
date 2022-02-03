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
    $._default, // highlight def[ault]
    $._syntax,
    $._set,
    $._setlocal,
    $._startinsert,
    $._stopinsert,
    $._global,
    $._colorscheme,
    $._comclear,
    $._delcommand,
    $._runtime,
    $._wincmd,
    $._sign,
  ],

  extras: ($) => [$._line_continuation, /[\t ]/],

  rules: {
    script_file: ($) => optional($._separated_statements),

    _separated_statements: ($) => repeat1(
      seq(optional($._statement), choice($._cmd_separator, $.comment))
    ),

    _statement: ($) => seq(repeat(':'), choice(
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
        $.colorscheme_statement,
        $.comclear_statement,
        $.delcommand_statement,
        $.filetype_statement,
        $.runtime_statement,
        $.wincmd_statement,
        $.sign_statement,
      )),

    return_statement: ($) =>
      seq(tokalias($, 'return'), optional($._expression)),

    normal_statement: ($) => command($, 'normal', alias(/.*/, $.commands)),
    startinsert_statement: ($) => maybe_bang($, tokalias($, 'startinsert')),
    stopinsert_statement: ($) => tokalias($, 'stopinsert'),
    comclear_statement: ($) => tokalias($, "comclear"),

    command_name: ($) => /[A-Z][A-Za-z0-9]*/,
    delcommand_statement: ($) => seq(tokalias($, 'delcommand'), $.command_name),

    _runtime_where: ($) =>
      choice(
        'START',
        'OPT',
        'PACK',
        'ALL',
      ),
    runtime_statement: ($) =>
      seq(
        maybe_bang($, tokalias($, 'runtime')),
        optional(alias($._runtime_where, $.where)),
        alias(repeat1($.filename), $.filenames),
      ),


    wincmd_statement: ($) =>
      seq(
        optional($.integer_literal),
        tokalias($, 'wincmd'),
        field('action', /[a-zA-Z=]/),
      ),

    global_statement: ($) => seq(
      maybe_bang($, tokalias($, 'global')),
      $._separator_first, $.pattern, $._separator,
      $._statement),

    _filetype_state: ($) => choice('on', 'off'),
    filetype_statement: ($) =>
      seq(
        'filetype',
        optional(
          choice(
            seq(
              optional('plugin'),
              optional('indent'),
              alias($._filetype_state, $.state)
            ),
            'detect',
          ),
        ),
      ),

    colorscheme_statement: ($) =>
      seq(
        tokalias($, 'colorscheme'),
        optional(alias($.filename, $.name)),
      ),

    lua_statement: ($) => seq('lua', choice($.chunk, $.script)),
    ruby_statement: ($) => seq(tokalias($, 'ruby'), choice($.chunk, $.script)),
    python_statement: ($) =>
      seq(tokalias($, 'python'), choice($.chunk, $.script)),
    perl_statement: ($) => seq('perl', choice($.chunk, $.script)),

    chunk: ($) => /[^\n]+/,

    _script_line: ($) => seq(optional($.chunk), '\n'),

    script: ($) =>
      seq(
        $._embedded_script_start,
        $._cmd_separator,
        repeat($._script_line),
        $._embedded_script_end,
      ),

    for_loop: ($) =>
      seq(
        'for',
        field('variable', choice($._ident, $.list)),
        'in',
        field('iter', $._expression),
        alias(optional($._separated_statements), $.body),
        tokalias($, 'endfor'),
      ),

    while_loop: ($) =>
      seq(
        'while',
        field('condition', $._expression),
        $._cmd_separator,
        alias(optional($._separated_statements), $.body),
        tokalias($, 'endwhile'),
      ),

    if_statement: ($) =>
      seq(
        'if',
        field('condition', $._expression),
        $._cmd_separator,
        alias(optional($._separated_statements), $.body),
        repeat($.elseif_statement),
        optional($.else_statement),
        tokalias($, 'endif'),
      ),

    elseif_statement: ($) =>
      seq(
        'elseif',
        field('condition', $._expression),
        alias(optional($._separated_statements), $.body),
      ),

    else_statement: ($) => seq('else', alias(optional($._separated_statements), $.body)),

    try_statement: ($) =>
      seq(
        'try',
        $._cmd_separator,
        alias(optional($._separated_statements), $.body),
        repeat($.catch_statement),
        optional($.finally_statement),
        tokalias($, 'endtry'),
      ),

    _au_pattern: ($) => choice(/\/.*\//, /\?.*\?/),

    catch_statement: ($) =>
      seq(
        'catch',
        optional(alias($._au_pattern, $.pattern)),
        $._cmd_separator,
        alias(optional($._separated_statements), $.body),
      ),

    finally_statement: ($) =>
      seq('finally', alias(optional($._separated_statements), $.body)),

    throw_statement: ($) =>
      seq(tokalias($, 'throw'), $._expression),

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
      seq(maybe_bang($, 'unlet'), repeat1($._expression)),

    call_statement: ($) => seq('call', $.call_expression),

    echo_statement: ($) => echo_variant($, 'echo'),
    echomsg_statement: ($) => echo_variant($, 'echomsg'),

    execute_statement: ($) =>
      seq(tokalias($, 'execute'), repeat1($._expression)),

    silent_statement: ($) =>
      seq(maybe_bang($, tokalias($, 'silent')), $._statement),

    user_command: ($) =>
      seq(
        maybe_bang($, $.command_name),
        alias(repeat($.command_argument), $.arguments),
      ),

    command_argument: ($) => choice($.string_literal, /\S+/),

    function_definition: ($) =>
      seq(
        maybe_bang($, tokalias($, 'function')),
        $.function_declaration,
        any_order('dict', 'range', 'abort', 'closure'),
        $._cmd_separator,

        alias(optional($._separated_statements), $.body),

        tokalias($, 'endfunction'),
      ),

    function_declaration: ($) =>
      seq(
        field('name', $._ident),
        field('parameters', $.parameters),
      ),

    parameters: ($) => 
      seq(
        '(',
        choice(
          $.spread,
          seq(
            commaSep($.default_parameter),
            optional(seq(',', $.spread)),
          ),
          seq(
            commaSep($.identifier),
            optional(seq(',', commaSep($.default_parameter))),
            optional(seq(',', $.spread)),
          ),
        ),
        ')',
      ),

    default_parameter: ($) =>
      seq(
        field('name', $.identifier),
        '=',
        field('value', $._expression),
      ),


    bang: ($) => '!',

    at: ($) => '@',

    spread: ($) => '...',

    _printable: ($) => /[^\t\n\v\f\r]/,

    // :h 10.3

    mark: ($) => /'./,

    range_statement: ($) => $._range,

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
        $.pattern,
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

    _hl_body_link: ($) => seq(optional(tokalias($, 'default')), 'link', field('from', $.hl_group), field('to', $.hl_group)),

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
      seq(optional(tokalias($, 'default')), $.hl_group, repeat1($.hl_attribute)),

    _hl_body: ($) => choice($._hl_body_clear, $._hl_body_none, $._hl_body_keys, $._hl_body_link),

    highlight_statement: ($) =>
      seq(
        maybe_bang($, tokalias($, 'highlight')),
        optional($._hl_body),
      ),

    // :h :syntax
    _syn_enable: ($) => sub_cmd(choice('enable', 'on', 'off', 'reset')),

    _syn_case: ($) => sub_cmd('case', optional(choice('match', 'ignore'))),

    _syn_spell: ($) =>
      sub_cmd('spell', optional(choice('toplevel', 'notoplevel', 'default'))),

    _syn_foldlevel: ($) =>
      sub_cmd('foldlevel', optional(choice('start', 'minimum'))),

    _syn_iskeyword: ($) =>
      sub_cmd('iskeyword', optional(choice('clear', alias(/[^ \n]+/, $.value)))),

    _syn_conceal: ($) =>
      sub_cmd('conceal', optional(choice('on', 'off'))),

    // :h :syn-arguments

    _syn_hl_pattern: ($) =>
      seq($._separator_first, $.pattern, $._separator),

    hl_groups: ($) => commaSep1(maybe_at($, $.hl_group)),

    // FIXME: find better names for rules (_syn_arguments_[basic|match|region])
    _syn_arguments_keyword: ($) =>
      choice(
        key_val_arg('conceal'),
        key_val_arg('cchar', optional(token.immediate(/[^\t\n\v\f\r]/))),
        key_val_arg('contained'),
        // FIXME: allow regex of hlgroups
        key_val_arg('containedin', optional($.hl_groups)),
        key_val_arg('nextgroup', optional($.hl_groups)),
        key_val_arg('transparent'),
        key_val_arg('skipwhite'),
        key_val_arg('skipnl'),
        key_val_arg('skipempty'),
      ),

    _syn_arguments_match: ($) =>
      choice(
        $._syn_arguments_keyword,
        key_val_arg('contains', optional($.hl_groups)),
        key_val_arg('fold'),
        key_val_arg('display'),
        key_val_arg('extend'),
        key_val_arg('keepend'),
        key_val_arg('excludenl'),
      ),

    _syn_arguments_region: ($) =>
      choice(
        $._syn_arguments_match,
        key_val_arg('matchgroup', optional($.hl_groups)),
        key_val_arg('oneline'),
        key_val_arg('concealends'),
      ),

    _syn_arguments_cluster: ($) => choice(
      key_val_arg('contains', optional($.hl_groups)),
      key_val_arg('add', optional($.hl_groups)),
      key_val_arg('remove', optional($.hl_groups)),
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
      sub_cmd(
        'keyword',
        $.hl_group,
        repeat(alias($._syn_arguments_keyword, $.syntax_argument)),
        // The list of keyword cannot be empty, but we can have arguments anywhere on the line
        alias(/[a-zA-Z0-9\[\]_]+/, $.keyword),
        repeat(choice(
          alias($._syn_arguments_keyword, $.syntax_argument),
          alias(/[a-zA-Z0-9\[\]_]+/, $.keyword),
        )),
      ),

    _syn_match: ($) =>
      sub_cmd(
        'match',
        $.hl_group,
        repeat(alias($._syn_arguments_match, $.syntax_argument)),
        $._syn_hl_pattern,
        commaSep(alias($._syn_pattern_offset, $.pattern_offset)),
        repeat(alias($._syn_arguments_match, $.syntax_argument)),
      ),

    _syn_region_start: ($) => syn_region_arg($, 'start'),
    _syn_region_skip: ($) => syn_region_arg($, 'skip'),
    _syn_region_end: ($) => syn_region_arg($, 'end'),

    _syn_region: ($) =>
      sub_cmd(
        'region',
        $.hl_group,
        repeat(alias($._syn_arguments_region, $.syntax_argument)),
        alias($._syn_region_start, $.syntax_argument),
        repeat(alias($._syn_arguments_region, $.syntax_argument)),
        optional(
          seq(
            alias($._syn_region_skip, $.syntax_argument),
            repeat(alias($._syn_arguments_region, $.syntax_argument)),
          ),
        ),
        // Can have multiple end
        repeat1(
          seq(
            alias($._syn_region_end, $.syntax_argument),
            repeat(alias($._syn_arguments_region, $.syntax_argument)),
          ),
        ),
      ),

    _syn_cluster: ($) =>
      sub_cmd(
        'cluster',
        $.hl_group,
        repeat(alias($._syn_arguments_cluster, $.syntax_argument)),
      ),

    _syn_include: ($) =>
      sub_cmd(
        'include',
        // Here we can't have pattern and `@` is mandatory
        optional(field('grouplist', seq('@', $.hl_group))),
        $.filename,
      ),


    // :h syn-sync
    _syn_sync_lines: ($) => key_val_arg(choice('minlines', 'maxlines'), /[0-9]+/),
    _syn_sync: ($) =>
      sub_cmd(
        'sync',
        choice(
          syn_sync_method('linebreaks', token.immediate('='), field('val', token.immediate(/[0-9]+/))),
          syn_sync_method('fromstart'),
          syn_sync_method('ccomment', optional($.hl_group), repeat($._syn_sync_lines)),
          syn_sync_method(
            choice(
              'lines',
              'minlines',
              'maxlines'
            ),
            token.immediate('='),
            field('val', token.immediate(/[0-9]+/)),
          ),
          syn_sync_method(
            choice(
              'match',
              'region'
            ),
            $.hl_group,
            optional(
              seq(
                choice(
                  'grouphere',
                  'groupthere'
                ),
                $.hl_group)
            ),
            $.pattern
          ),
          syn_sync_method('linecont', repeat($._syn_sync_lines), $.pattern, repeat($._syn_sync_lines)),
          syn_sync_method('clear', optional($.hl_group))
        ),
      ),

    _syn_list: ($) =>
      sub_cmd(
        'list',
        optional(maybe_at($, $.hl_group)),
      ),

    _syn_clear: ($) =>
      sub_cmd(
        'clear',
        optional(maybe_at($, $.hl_group)),
      ),

    syntax_statement: ($) =>
      seq(
        tokalias($, 'syntax'),
        // `:syntax` = `:syntax list`
        optional(
          choice(
            $._syn_enable,
            $._syn_case,
            $._syn_spell,
            $._syn_foldlevel,
            $._syn_iskeyword,
            $._syn_conceal,
            $._syn_keyword,
            $._syn_match,
            $._syn_region,
            $._syn_cluster,
            $._syn_include,
            $._syn_sync,
            $._syn_list,
            $._syn_clear,
          ),
        ),
      ),

    // :h sign

    _sign_name: ($) => choice($.integer_literal, $.identifier),

    _sign_define_arg_text: ($) => seq($._printable, optional($._printable)),
    _sign_define_argument: ($) =>
      choice(
        key_val_arg('icon', optional($.filename)),
        key_val_arg('linehl', optional($.hl_group)),
        key_val_arg('numhl', optional($.hl_group)),
        key_val_arg('text', optional(alias($._sign_define_arg_text, $.text))),
        key_val_arg('texthl', optional($.hl_group)),
        key_val_arg('culhl', optional($.hl_group)),
      ),

    _sign_define: ($) =>
      sub_cmd(
        'define',
        field('name', $._sign_name),
        repeat(alias($._sign_define_argument, $.sign_argument)),
      ),

    _sign_undefine: ($) =>
      sub_cmd(
        'undefine',
        field('name', $._sign_name),
      ),

    _sign_list: ($) =>
      sub_cmd(
        'list',
        optional(field('name', $._sign_name)),
      ),

    // :h sign-place
    _sign_place_place_argument: ($) =>
      choice(
        key_val_arg('line', $.integer_literal),
        key_val_arg('name', $._sign_name),
        key_val_arg('buffer', $.integer_literal),
        key_val_arg('group', $.hl_group),
        key_val_arg('priority', $.integer_literal),
        key_val_arg('file', $.filename),
      ),
    _sign_place_place: ($) =>
      seq(
        field('id', $.integer_literal),
        repeat1(alias($._sign_place_place_argument, $.sign_argument)),
      ),
    // :h sign-place-list
    _sign_place_list_argument: ($) =>
      choice(
        key_val_arg('file', $.filename),
        key_val_arg('buffer', $.integer_literal),
        key_val_arg('group', choice($.hl_group, alias(token.immediate('*'), $.wildcard))),
      ),
    _sign_place_list: ($) =>
      repeat1(alias($._sign_place_list_argument, $.sign_argument)),
    _sign_place: ($) =>
      sub_cmd(
        'place',
        choice(
          $._sign_place_place,
          $._sign_place_list,
        ),
      ),

    _sign_unplace_cursor_argument: ($) =>
      key_val_arg('group', choice($.hl_group, alias(token.immediate('*'), $.wildcard))),
    _sign_unplace_cursor: ($) =>
      alias($._sign_unplace_cursor_argument, $.sign_argument),
    _sign_unplace_id_argument: ($) =>
      choice(
        key_val_arg('file', $.filename),
        key_val_arg('buffer', $.integer_literal),
        key_val_arg('group', choice($.hl_group, alias(token.immediate('*'), $.wildcard))),
      ),
    _sign_unplace_id: ($) =>
      seq(
        field('id', choice($.integer_literal, alias('*', $.wildcard))),
        repeat(alias($._sign_unplace_id_argument, $.sign_argument)),
      ),
    _sign_unplace: ($) =>
      sub_cmd(
        'unplace',
        optional(
          choice(
            $._sign_unplace_cursor,
            $._sign_unplace_id,
          ),
        ),
      ),

    _sign_jump_argument: ($) =>
      choice(
        key_val_arg('file', $.filename),
        key_val_arg('buffer', $.integer_literal),
        key_val_arg('group', $.hl_group),
      ),
    _sign_jump: ($) =>
      sub_cmd(
        'jump',
        field('id', choice($.integer_literal, alias('*', $.wildcard))),
        repeat(alias($._sign_jump_argument, $.sign_argument)),
      ),

    sign_statement: ($) =>
      seq(
        tokalias($, 'sign'),
        choice(
          $._sign_define,
          $._sign_undefine,
          $._sign_list,
          $._sign_place,
          $._sign_unplace,
          $._sign_jump,
        ),
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

    // Use default :h isfname
    filename: ($) =>
      seq(
        // First character of a filename is not immediate
        choice(
          /[A-Za-z0-9]/,
          /[/._+,#$%~=-]/,
          // Include windows characters
          /[\\{}\[\]:@!]/,
          // Allow wildcard
          /[*]/,
          // Escaped character
          seq('\\', /./),
        ),
        repeat(
          choice(
            ...[
              /[A-Za-z0-9]/,
              /[/._+,#$%~=-]/,
              // Include windows characters
              /[\\{}\[\]:@!]/,
              // Allow wildcard
              /[*]/,
              // Escaped character
              seq('\\', /./),
            ].map(token.immediate),
          ),
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
      repeat1(
        choice(
          seq(
            '[',
            repeat(choice(
              seq('\\', /./), // escaped character
              /[^\]\n\\]/       // any character besides ']', '\' or '\n'
            )),
            ']'
          ),              // square-bracket-delimited character class
          seq('\\', /./), // escaped character
          /[^\\\[\n]/    // any character besides '[', '\' or '\n'
        ),
      ),

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

function maybe_at($, rule) {
  return seq(optional($.at), rule);
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
  return seq(tokalias($, cmd), repeat($._expression));
}

function set_variant($, cmd) {
  return seq(tokalias($, cmd), sep1($.set_item, ' '));
}

function any_order(...args) {
  return repeat(choice(...args));
}

function hl_key_val(left, right) {
  return seq(field('key', left), token.immediate('='), field('val', right));
}

function sub_cmd(sub, ...args) {
  if (args.length > 0) {
    return seq(field('sub', sub), ...args);
  } else {
    return field('sub', sub);
  }
}

function key_val_arg(arg, ...args) {
  if (args.length > 0)
    return seq(field('name', arg), token.immediate('='), field('val', ...args));
  else
    return field('name', arg);
}

function syn_region_arg($, name) {
  return seq(key_val_arg(name, $._syn_hl_pattern), commaSep(alias($._syn_pattern_offset, $.pattern_offset)));
}

function syn_sync_method(arg, ...args) {
  if (args.length > 0)
    return seq(field('method', arg), ...args);
  else
    return field('method', arg);
}


function keys($, allowed) {
  return seq(
    choice(allowed, $.keycode),
    repeat(choice(token.immediate(allowed), $._immediate_keycode)),
  );
}
