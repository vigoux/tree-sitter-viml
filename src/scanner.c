#include "stdio.h"
#include "stdlib.h"
#include <tree_sitter/parser.h>
#include <string.h>
#include <wctype.h>
#include <assert.h>

#define IS_SPACE_TABS(char) ((char) == ' ' || (char) == '\t')

typedef struct {
  // The EOF markers (but they can be whatever so lex that correctly)
  char *script_marker;
  uint8_t marker_len;

} Scanner;

enum TokenType {
  NO,
  INV,
  CMD_SEPARATOR,
  LINE_CONTINUATION,
  EMBEDDED_SCRIPT_START,
  EMDEDDED_SCRIPT_END,
  SCOPE_DICT,
  SCOPE,
  STRING,
  COMMENT,
  // Many many many many keywords that are impossible to lex otherwise
  FUNCTION,
  ENDFUNCTION, // For some reason any other end works
  ENDFOR,
  ENDWHILE,
  ENDIF,
  ENDTRY,
  NORMAL,
  RETURN,
  RUBY,
  PYTHON,
  THROW,
  EXECUTE,
  AUTOCMD,
  SILENT,
  TOKENTYPE_NR
};

#define TRIE_START (COMMENT + 1)

typedef char* keyword[2];

#define KEYWORD(tk, m, opt) [tk - TRIE_START] = { (m), (opt) }

keyword keywords[] = {
  KEYWORD(FUNCTION, "fu", "nction"),
  KEYWORD(ENDFUNCTION, "end", "function"),
  KEYWORD(ENDFOR, "endfo", "r"),
  KEYWORD(ENDWHILE, "endw", "hile"),
  KEYWORD(ENDIF, "en", "dif"),
  KEYWORD(ENDTRY, "endt", "ry"),
  KEYWORD(NORMAL, "norm", "al"),
  KEYWORD(RETURN, "retu", "rn"),
  KEYWORD(RUBY, "rub", "y"),
  KEYWORD(PYTHON, "py", "thon"),
  KEYWORD(THROW, "th", "row"),
  KEYWORD(EXECUTE, "exe", "cute"),
  KEYWORD(AUTOCMD, "au", "tocmd"),
  KEYWORD(SILENT, "sil", "ent"),
};

void *tree_sitter_vim_external_scanner_create() {
  Scanner *s = (Scanner *)malloc(sizeof(Scanner));
  s->marker_len = 0;
  s->script_marker = NULL;

  return (void *)s;
}

void tree_sitter_vim_external_scanner_destroy(void *payload) {
  Scanner *s = (Scanner *)payload;

  if (s->marker_len > 0) {
    free(s->script_marker);
  }

  free(s);
}

/// Serialize / deserialize
//
// Memory layout is :
//
// [ marker_len, marker ... (marker_len size) ]


unsigned int tree_sitter_vim_external_scanner_serialize(void *payload,
                                                        char *buffer) {
  Scanner *s = (Scanner *)payload;
  buffer[0] = s->marker_len;

  strncpy(buffer + 1, s->script_marker, s->marker_len);

  return s->marker_len + 1;
}

void tree_sitter_vim_external_scanner_deserialize(void *payload,
                                                  const char *buffer,
                                                  unsigned length) {
  if (length == 0) {
    return;
  }

  Scanner *s = (Scanner *)payload;
  s->marker_len = buffer[0];

  // Sanity check, just to be sure
  assert(s->marker_len + 1 == length);

  if (s->marker_len > 0) {
    s->script_marker = (char *)malloc(s->marker_len);
    strncpy(s->script_marker, buffer + 1, s->marker_len);
  }
}

static void advance(TSLexer *lexer, bool skip) { lexer->advance(lexer, skip); }

void skip_space_tabs(TSLexer *lexer) {
  while (IS_SPACE_TABS(lexer->lookahead)) {
    advance(lexer, true);
  }
}

bool check_prefix(TSLexer *lexer, char *preffix, unsigned int preffix_len,
                  enum TokenType token) {
  for (unsigned int i = 0; i < preffix_len; i++) {
    if (lexer->lookahead == preffix[i]) {
      advance(lexer, false);
    } else {
      return false;
    }
  }

  lexer->result_symbol = token;
  return true;
}

bool try_lex_script_start(Scanner *scanner, TSLexer *lexer)
{
  if (scanner->script_marker != NULL) {
    // There must be an error
    return false;
  }
  char marker[UINT8_MAX] = { '\0' };
  uint16_t marker_len = 0;

  // Lex <<
  for(size_t j = 0; j < 2; j++) {
    if (lexer->lookahead != '<') {
      return false;
    }
    advance(lexer, false);
  }
  skip_space_tabs(lexer);

  // We should be at the start of the script marker
  while (!IS_SPACE_TABS(lexer->lookahead) && lexer->lookahead != '\n' && marker_len < UINT8_MAX) {
    marker[marker_len] = lexer->lookahead;
    marker_len++;
    advance(lexer, false);
  }

  scanner->script_marker = (char *)malloc(marker_len);
  strncpy(scanner->script_marker, marker, marker_len);
  scanner->marker_len = marker_len;

  return true;
}

inline bool is_valid_string_delim(char c) {
  return c == '\'' || c == '"';
}

bool lex_literal_string(TSLexer *lexer) {
  while (true) {
    if(lexer->lookahead == '\'') {
      // Maybe end of string, but not sure, it could be double quote
      advance(lexer, false);
      if (lexer->lookahead == '\'') {
        advance(lexer, false);
      } else {
        lexer->result_symbol = STRING;
        return true;
      }
    } else if (lexer->lookahead == '\n') {
      // Invalid EOL here
      return false;
    } else {
      advance(lexer, false);
    }
  }
}

// FIXME: this does not support comments like `" Hello "mister" how are you ?`
bool lex_escapable_string(TSLexer *lexer) {
  while (true) {
    if (lexer->lookahead == '\\') {
      advance(lexer, false);
      advance(lexer, false);
    } else if (lexer->lookahead == '"') {
      advance(lexer, false);
      lexer->result_symbol = STRING;
      return true;
    } else if (lexer->lookahead == '\n') {
      lexer->result_symbol = COMMENT;
      return true;
    } else {
      advance(lexer, false);
    }
  }
}

bool lex_string(TSLexer *lexer) {
  char string_delim;

  if (!is_valid_string_delim(lexer->lookahead)) {
    return false;
  }

  string_delim = lexer->lookahead;
  advance(lexer, false);

  switch (string_delim) {
    case '"':
      return lex_escapable_string(lexer);
    case '\'':
      return lex_literal_string(lexer);
    default:
      assert(0);
  }
}

bool try_lex_keyword(char *possible, keyword keyword) {

  // Try lexing mandatory part
  size_t i;
  for (i = 0; keyword[0][i] && possible[i]; i++) {
    if (possible[i] != keyword[0][i]) {
      return false;
    }
  }

  size_t mandat_len = i;
  // Now try lexing optional part
  for (size_t i = 0; keyword[1][i] && possible[mandat_len + i]; i++) {
    if (possible[mandat_len + i] != keyword[1][i]) {
      return false;
    }
  }

  return true;
}

bool scope_correct(TSLexer *lexer) {
  const char *SCOPES = "lbstvwg<";
  for (size_t i = 0; SCOPES[i]; i++) {
    if (lexer->lookahead == SCOPES[i]) {
      return true;
    }
  }

  return false;
}

bool lex_scope(TSLexer *lexer) {
  if (!scope_correct(lexer)) {
    return false;
  }

  if (lexer->lookahead == '<') {
    advance(lexer, false);
    const char sid[4 + 1] = "SID>";
    for (size_t i = 0; sid[i] && lexer->lookahead; i++) {
      if (lexer->lookahead != sid[i]) {
        return false;
      }
      advance(lexer, false);
    }
    lexer->result_symbol = SCOPE;
    return true;
  } else {
    advance(lexer, false);

    if (lexer->lookahead != ':') {
      return false;
    }
    advance(lexer, false);

    if (iswalnum(lexer->lookahead)) {
      lexer->result_symbol = SCOPE;
    } else {
      lexer->result_symbol = SCOPE_DICT;
    }

    return true;
  }
}

bool tree_sitter_vim_external_scanner_scan(void *payload, TSLexer *lexer,
                                           const bool *valid_symbols) {
  Scanner *s = (Scanner *)payload;

  skip_space_tabs(lexer);

  // options can be inverted by prepending a 'no' or 'inv'
  if (valid_symbols[NO] && lexer->lookahead == 'n') {
    return check_prefix(lexer, "no", 2, NO);
  } else if (valid_symbols[INV] && lexer->lookahead == 'i') {
    return check_prefix(lexer, "inv", 3, INV);
  }

  // cmd separator and | this is not trivial at all because of how line
  // continuations are handled after encoutering an EOL :
  //  - Next line starts by a `\\` ?
  //    - Yes : is next character `/` or `?` ?
  //      - Yes : Next line is another command (preceded by a range)
  //      - No : This is a line continuation
  //    - No : Next line is another command.
  //
  // This ambiguity forces us to use the mark_end function and lookahead more
  // than just past the final newline and indentationg character.
  if (valid_symbols[CMD_SEPARATOR] && valid_symbols[LINE_CONTINUATION]) {
    if (lexer->lookahead == '\n') {
      advance(lexer, false);
      lexer->mark_end(lexer);
      skip_space_tabs(lexer);

      if (lexer->lookahead == '\\') {
        // You think this is a line continuation ? It might not
        advance(lexer, false);

        if (lexer->lookahead == '/'
            || lexer->lookahead == '?'
            || lexer->lookahead == '&') {
          // Actually this might be a range before a command
          lexer->result_symbol = CMD_SEPARATOR;
          return true;
        }

        lexer->mark_end(lexer);
        lexer->result_symbol = LINE_CONTINUATION;
        return true;
      } else {
        lexer->result_symbol = CMD_SEPARATOR;
        return true;
      }
    } else if (lexer->lookahead == '|') {
      advance(lexer, false);
      if (lexer->lookahead == '|') {
        // This is an or expression
        return false;
      }
      lexer->mark_end(lexer); // Because we broke advance before

      lexer->result_symbol = CMD_SEPARATOR;
      return true;
    }
  }

  // Script starts and ends
  if (valid_symbols[EMBEDDED_SCRIPT_START]) {
    lexer->result_symbol = EMBEDDED_SCRIPT_START;
    return try_lex_script_start(s, lexer);
  } else if (valid_symbols[EMDEDDED_SCRIPT_END]) {
    if (s->marker_len == 0) {
      // This must be an error
      return false;
    }

    for (size_t i = 0; i < s->marker_len; i++) {
      if (s->script_marker[i] != lexer->lookahead) {
        return false;
      } else {
        advance(lexer, false);
      }
    }

    // Found the end marker
    lexer->result_symbol = EMDEDDED_SCRIPT_END;
    s->marker_len = 0;
    free(s->script_marker);

    return true;
  }

  if (scope_correct(lexer) && (valid_symbols[SCOPE_DICT] || valid_symbols[SCOPE])) {
    if (lex_scope(lexer)) {
      return true;
    } else {
      return false;
    }
  }

  // Other keywords
  if (iswlower(lexer->lookahead)) {
#define KEYWORD_SIZE 30
    char keyword[KEYWORD_SIZE + 1] = { lexer->lookahead, 0 };

    advance(lexer, false);

    size_t i = 1;
    for (; i < KEYWORD_SIZE && iswlower(lexer->lookahead); i++) {
      keyword[i] = lexer->lookahead;
      advance(lexer, false);
    }

    if (i == KEYWORD_SIZE) {
      return false;
    }

    keyword[i] = '\0';

    // Now really try to find the keyword
    for (enum TokenType t = TRIE_START; t < TOKENTYPE_NR; t++) {
      if (valid_symbols[t] && try_lex_keyword(keyword, keywords[t - TRIE_START])) {
        lexer->result_symbol = t;
        return true;
      }
    }
#undef KEYWORD_SIZE
  }

  // String and comments
  if (valid_symbols[COMMENT] && !valid_symbols[STRING]
      && lexer->lookahead == '"') {
    do {
      advance(lexer, false);
    } while (lexer->lookahead != '\n');

    lexer->result_symbol = COMMENT;
    return true;
  } else if (valid_symbols[STRING] && valid_symbols[COMMENT]) {
    return lex_string(lexer);
  }

  return false;
}

// vim: tabstop=2
