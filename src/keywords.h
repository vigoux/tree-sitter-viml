typedef enum {
  FUNCTION = 0,
  ENDFUNCTION = 1,
  FOR = 2,
  ENDFOR = 3,
  WHILE = 4,
  ENDWHILE = 5,
  IF = 6,
  ELSEIF = 7,
  ELSE = 8,
  ENDIF = 9,
  TRY = 10,
  CATCH = 11,
  FINALLY = 12,
  ENDTRY = 13,
  CONST = 14,
  NORMAL = 15,
  RETURN = 16,
  PERL = 17,
  LUA = 18,
  RUBY = 19,
  PYTHON = 20,
  THROW = 21,
  EXECUTE = 22,
  AUTOCMD = 23,
  SILENT = 24,
  ECHO = 25,
  ECHON = 26,
  ECHOHL = 27,
  ECHOMSG = 28,
  ECHOERR = 29,
  MAP = 30,
  NMAP = 31,
  VMAP = 32,
  XMAP = 33,
  SMAP = 34,
  OMAP = 35,
  IMAP = 36,
  LMAP = 37,
  CMAP = 38,
  TMAP = 39,
  NOREMAP = 40,
  VNOREMAP = 41,
  NNOREMAP = 42,
  XNOREMAP = 43,
  SNOREMAP = 44,
  ONOREMAP = 45,
  INOREMAP = 46,
  LNOREMAP = 47,
  CNOREMAP = 48,
  TNOREMAP = 49,
  AUGROUP = 50,
  HIGHLIGHT = 51,
  DEFAULT = 52,
  SYNTAX = 53,
  SET = 54,
  SETLOCAL = 55,
  SETFILETYPE = 56,
  BROWSE = 57,
  OPTIONS = 58,
  STARTINSERT = 59,
  STOPINSERT = 60,
  SCRIPTENCODING = 61,
  SOURCE = 62,
  GLOBAL = 63,
  COLORSCHEME = 64,
  COMMAND = 65,
  COMCLEAR = 66,
  DELCOMMAND = 67,
  RUNTIME = 68,
  WINCMD = 69,
  SIGN = 70,
  FILETYPE = 71,
  LET = 72,
  UNLET = 73,
  CALL = 74,
  BREAK = 75,
  CONTINUE = 76,
  UNKNOWN_COMMAND
} kwid;

keyword keywords[] = {
  [FUNCTION] = {
    .mandat = "fu",
    .opt = "nction",
    .ignore_comments_after = false
  },
  [ENDFUNCTION] = {
    .mandat = "endf",
    .opt = "unction",
    .ignore_comments_after = false
  },
  [FOR] = {
    .mandat = "for",
    .opt = "",
    .ignore_comments_after = false
  },
  [ENDFOR] = {
    .mandat = "endfo",
    .opt = "r",
    .ignore_comments_after = false
  },
  [WHILE] = {
    .mandat = "wh",
    .opt = "ile",
    .ignore_comments_after = false
  },
  [ENDWHILE] = {
    .mandat = "endw",
    .opt = "hile",
    .ignore_comments_after = false
  },
  [IF] = {
    .mandat = "if",
    .opt = "",
    .ignore_comments_after = false
  },
  [ELSEIF] = {
    .mandat = "elsei",
    .opt = "f",
    .ignore_comments_after = false
  },
  [ELSE] = {
    .mandat = "el",
    .opt = "se",
    .ignore_comments_after = false
  },
  [ENDIF] = {
    .mandat = "en",
    .opt = "dif",
    .ignore_comments_after = false
  },
  [TRY] = {
    .mandat = "try",
    .opt = "",
    .ignore_comments_after = false
  },
  [CATCH] = {
    .mandat = "cat",
    .opt = "ch",
    .ignore_comments_after = false
  },
  [FINALLY] = {
    .mandat = "fina",
    .opt = "lly",
    .ignore_comments_after = false
  },
  [ENDTRY] = {
    .mandat = "endt",
    .opt = "ry",
    .ignore_comments_after = false
  },
  [CONST] = {
    .mandat = "cons",
    .opt = "t",
    .ignore_comments_after = false
  },
  [NORMAL] = {
    .mandat = "norm",
    .opt = "al",
    .ignore_comments_after = false
  },
  [RETURN] = {
    .mandat = "retu",
    .opt = "rn",
    .ignore_comments_after = false
  },
  [PERL] = {
    .mandat = "perl",
    .opt = "",
    .ignore_comments_after = false
  },
  [LUA] = {
    .mandat = "lua",
    .opt = "",
    .ignore_comments_after = false
  },
  [RUBY] = {
    .mandat = "rub",
    .opt = "y",
    .ignore_comments_after = false
  },
  [PYTHON] = {
    .mandat = "py",
    .opt = "thon",
    .ignore_comments_after = false
  },
  [THROW] = {
    .mandat = "th",
    .opt = "row",
    .ignore_comments_after = false
  },
  [EXECUTE] = {
    .mandat = "exe",
    .opt = "cute",
    .ignore_comments_after = false
  },
  [AUTOCMD] = {
    .mandat = "au",
    .opt = "tocmd",
    .ignore_comments_after = false
  },
  [SILENT] = {
    .mandat = "sil",
    .opt = "ent",
    .ignore_comments_after = false
  },
  [ECHO] = {
    .mandat = "ec",
    .opt = "ho",
    .ignore_comments_after = true
  },
  [ECHON] = {
    .mandat = "echon",
    .opt = "",
    .ignore_comments_after = true
  },
  [ECHOHL] = {
    .mandat = "echoh",
    .opt = "l",
    .ignore_comments_after = false
  },
  [ECHOMSG] = {
    .mandat = "echom",
    .opt = "sg",
    .ignore_comments_after = true
  },
  [ECHOERR] = {
    .mandat = "echoe",
    .opt = "rr",
    .ignore_comments_after = true
  },
  [MAP] = {
    .mandat = "map",
    .opt = "",
    .ignore_comments_after = true
  },
  [NMAP] = {
    .mandat = "nm",
    .opt = "ap",
    .ignore_comments_after = true
  },
  [VMAP] = {
    .mandat = "vm",
    .opt = "ap",
    .ignore_comments_after = true
  },
  [XMAP] = {
    .mandat = "xm",
    .opt = "ap",
    .ignore_comments_after = true
  },
  [SMAP] = {
    .mandat = "smap",
    .opt = "",
    .ignore_comments_after = true
  },
  [OMAP] = {
    .mandat = "om",
    .opt = "ap",
    .ignore_comments_after = true
  },
  [IMAP] = {
    .mandat = "im",
    .opt = "ap",
    .ignore_comments_after = true
  },
  [LMAP] = {
    .mandat = "lm",
    .opt = "ap",
    .ignore_comments_after = true
  },
  [CMAP] = {
    .mandat = "cm",
    .opt = "ap",
    .ignore_comments_after = true
  },
  [TMAP] = {
    .mandat = "tma",
    .opt = "p",
    .ignore_comments_after = true
  },
  [NOREMAP] = {
    .mandat = "no",
    .opt = "remap",
    .ignore_comments_after = true
  },
  [VNOREMAP] = {
    .mandat = "nn",
    .opt = "oremap",
    .ignore_comments_after = true
  },
  [NNOREMAP] = {
    .mandat = "vn",
    .opt = "oremap",
    .ignore_comments_after = true
  },
  [XNOREMAP] = {
    .mandat = "xn",
    .opt = "oremap",
    .ignore_comments_after = true
  },
  [SNOREMAP] = {
    .mandat = "snor",
    .opt = "emap",
    .ignore_comments_after = true
  },
  [ONOREMAP] = {
    .mandat = "ono",
    .opt = "remap",
    .ignore_comments_after = true
  },
  [INOREMAP] = {
    .mandat = "ino",
    .opt = "remap",
    .ignore_comments_after = true
  },
  [LNOREMAP] = {
    .mandat = "ln",
    .opt = "oremap",
    .ignore_comments_after = true
  },
  [CNOREMAP] = {
    .mandat = "cno",
    .opt = "remap",
    .ignore_comments_after = true
  },
  [TNOREMAP] = {
    .mandat = "tno",
    .opt = "remap",
    .ignore_comments_after = true
  },
  [AUGROUP] = {
    .mandat = "aug",
    .opt = "roup",
    .ignore_comments_after = true
  },
  [HIGHLIGHT] = {
    .mandat = "hi",
    .opt = "ghlight",
    .ignore_comments_after = false
  },
  [DEFAULT] = {
    .mandat = "def",
    .opt = "ault",
    .ignore_comments_after = false
  },
  [SYNTAX] = {
    .mandat = "sy",
    .opt = "ntax",
    .ignore_comments_after = false
  },
  [SET] = {
    .mandat = "se",
    .opt = "t",
    .ignore_comments_after = false
  },
  [SETLOCAL] = {
    .mandat = "setl",
    .opt = "ocal",
    .ignore_comments_after = false
  },
  [SETFILETYPE] = {
    .mandat = "setf",
    .opt = "iletype",
    .ignore_comments_after = false
  },
  [BROWSE] = {
    .mandat = "bro",
    .opt = "wse",
    .ignore_comments_after = false
  },
  [OPTIONS] = {
    .mandat = "opt",
    .opt = "ions",
    .ignore_comments_after = false
  },
  [STARTINSERT] = {
    .mandat = "star",
    .opt = "tinsert",
    .ignore_comments_after = false
  },
  [STOPINSERT] = {
    .mandat = "stopi",
    .opt = "nsert",
    .ignore_comments_after = false
  },
  [SCRIPTENCODING] = {
    .mandat = "scripte",
    .opt = "ncoding",
    .ignore_comments_after = false
  },
  [SOURCE] = {
    .mandat = "so",
    .opt = "urce",
    .ignore_comments_after = false
  },
  [GLOBAL] = {
    .mandat = "g",
    .opt = "lobal",
    .ignore_comments_after = false
  },
  [COLORSCHEME] = {
    .mandat = "colo",
    .opt = "rscheme",
    .ignore_comments_after = false
  },
  [COMMAND] = {
    .mandat = "com",
    .opt = "mand",
    .ignore_comments_after = false
  },
  [COMCLEAR] = {
    .mandat = "comc",
    .opt = "lear",
    .ignore_comments_after = false
  },
  [DELCOMMAND] = {
    .mandat = "delc",
    .opt = "ommand",
    .ignore_comments_after = false
  },
  [RUNTIME] = {
    .mandat = "ru",
    .opt = "ntime",
    .ignore_comments_after = false
  },
  [WINCMD] = {
    .mandat = "winc",
    .opt = "md",
    .ignore_comments_after = false
  },
  [SIGN] = {
    .mandat = "sig",
    .opt = "n",
    .ignore_comments_after = false
  },
  [FILETYPE] = {
    .mandat = "filet",
    .opt = "ype",
    .ignore_comments_after = false
  },
  [LET] = {
    .mandat = "let",
    .opt = "",
    .ignore_comments_after = false
  },
  [UNLET] = {
    .mandat = "unl",
    .opt = "et",
    .ignore_comments_after = false
  },
  [CALL] = {
    .mandat = "cal",
    .opt = "l",
    .ignore_comments_after = false
  },
  [BREAK] = {
    .mandat = "brea",
    .opt = "k",
    .ignore_comments_after = false
  },
  [CONTINUE] = {
    .mandat = "con",
    .opt = "tinue",
    .ignore_comments_after = false
  },
};