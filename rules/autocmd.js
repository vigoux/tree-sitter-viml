const { maybe_bang, keyword, commaSep1, case_insensitive } = require("./utils");

// :h events
const EVENTS = [
  "BufAdd",
  "BufDelete",
  "BufEnter",
  "BufFilePost",
  "BufFilePre",
  "BufHidden",
  "BufLeave",
  "BufModifiedSet",
  "BufNew",
  "BufNewFile",
  "BufRead",
  "BufReadPost",
  "BufReadCmd",
  "BufReadPre",
  "BufUnload",
  "BufWinEnter",
  "BufWinLeave",
  "BufWipeout",
  "BufWrite",
  "BufWritePre",
  "BufWriteCmd",
  "BufWritePost",
  "ChanInfo",
  "ChanOpen",
  "CmdUndefined",
  "CmdlineChanged",
  "CmdlineEnter",
  "CmdlineLeave",
  "CmdwinEnter",
  "CmdwinLeave",
  "ColorScheme",
  "ColorSchemePre",
  "CompleteChanged",
  "CompleteDonePre",
  "CompleteDone",
  "CursorHold",
  "CursorHoldI",
  "CursorMoved",
  "CursorMovedI",
  "DiffUpdated",
  "DirChanged",
  "DirChangedPre",
  "ExitPre",
  "FileAppendCmd",
  "FileAppendPost",
  "FileAppendPre",
  "FileChangedRO",
  "FileChangedShell",
  "FileChangedShellPost",
  "FileReadCmd",
  "FileReadPost",
  "FileReadPre",
  "FileType",
  "FileWriteCmd",
  "FileWritePost",
  "FileWritePre",
  "FilterReadPost",
  "FilterReadPre",
  "FilterWritePost",
  "FilterWritePre",
  "FocusGained",
  "FocusLost",
  "FuncUndefined",
  "UIEnter",
  "UILeave",
  "InsertChange",
  "InsertCharPre",
  "InsertEnter",
  "InsertLeavePre",
  "InsertLeave",
  "MenuPopup",
  "ModeChanged",
  "OptionSet",
  "QuickFixCmdPre",
  "QuickFixCmdPost",
  "QuitPre",
  "RemoteReply",
  "SearchWrapped",
  "RecordingEnter",
  "RecordingLeave",
  "SessionLoadPost",
  "ShellCmdPost",
  "Signal",
  "ShellFilterPost",
  "SourcePre",
  "SourcePost",
  "SourceCmd",
  "SpellFileMissing",
  "StdinReadPost",
  "StdinReadPre",
  "SwapExists",
  "Syntax",
  "TabEnter",
  "TabLeave",
  "TabNew",
  "TabNewEntered",
  "TabClosed",
  "TermOpen",
  "TermEnter",
  "TermLeave",
  "TermClose",
  "TermResponse",
  "TextChanged",
  "TextChangedI",
  "TextChangedP",
  "TextYankPost",
  "User",
  // "UserGettingBored", just kidding ;)
  "VimEnter",
  "VimLeave",
  "VimLeavePre",
  "VimResized",
  "VimResume",
  "VimSuspend",
  "WinClosed",
  "WinEnter",
  "WinLeave",
  "WinNew",
  "WinScrolled",
].map(case_insensitive);

module.exports = {
  // If an event is valid, it should take precedence over identifier
  au_event: ($) => token(prec(1, choice(...EVENTS))),
  au_event_list: ($) => commaSep1($.au_event),

  _augroup_name: ($) => alias($.identifier, $.augroup_name),

  _autocmd_pattern: ($) => commaSep1(alias(/[^ \t\n,]+/, $.pattern)),

  au_once: ($) => "++once",
  au_nested: ($) => "++nested",

  _autocmd_command: ($) =>
    seq(
      $.au_event_list,
      $._autocmd_pattern,
      optional($.au_once),
      optional($.au_nested),
      field("command", $._statement)
    ),

  // :h autocmd-define
  _autocmd_define: ($) =>
    seq(keyword($, "autocmd"), optional($._augroup_name), $._autocmd_command),

  // :h autocmd-remove
  _autocmd_remove: ($) =>
    seq(
      keyword($, "autocmd"),
      $.bang,
      optional($._augroup_name),
      optional(
        choice(
          $._autocmd_command,
          seq($.au_event_list, $._autocmd_pattern),
          $._autocmd_pattern,
          $.au_event_list
        )
      )
    ),

  // :h autocmd-list
  _autocmd_list: ($) =>
    seq(
      keyword($, "autocmd"),
      optional($._augroup_name),
      optional(
        choice(
          seq($.au_event_list, $._autocmd_pattern),
          $._autocmd_pattern,
          $.au_event_list
        )
      )
    ),

  autocmd_statement: ($) =>
    choice($._autocmd_define, $._autocmd_remove, $._autocmd_list),

  augroup_statement: ($) =>
    seq(
      maybe_bang($, keyword($, "augroup")),
      alias($.identifier, $.augroup_name)
    ),
};
