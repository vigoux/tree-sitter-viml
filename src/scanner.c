#include "stdio.h"
#include "stdlib.h"
#include <tree_sitter/parser.h>

enum TokenType { NO, INV, SET_ARGUMENT };

struct state {
  bool maybe_no;
};

void *tree_sitter_vim_external_scanner_create() { return NULL; }

void tree_sitter_vim_external_scanner_destroy(void *payload) {}

unsigned int tree_sitter_vim_external_scanner_serialize(void *payload,
                                                        char *buffer) {
  return 0;
}

void tree_sitter_vim_external_scanner_deserialize(void *payload,
                                                  const char *buffer,
                                                  unsigned length) {}

void skip_whitespace(TSLexer *lexer) {
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    lexer->advance(lexer, true);
  }
}

bool check_prefix(TSLexer *lexer, char *preffix, unsigned int preffix_len, enum TokenType token) {
  for (unsigned int i = 0; i < preffix_len; i++) {
    if (lexer->lookahead == preffix[i]) {
      lexer->advance(lexer, false);
    } else {
      return false;
    }
  }

  lexer->result_symbol = token;
  return true;
}

bool is_whitespace(char c) {
  return c == ' ' || c == '\n' || c == '\t';
}

bool tree_sitter_vim_external_scanner_scan(void *payload, TSLexer *lexer,
                                           const bool *valid_symbols) {
  (void)payload;

  skip_whitespace(lexer);

  // options can be inverted by prepending a 'no'
  if (valid_symbols[NO] && lexer->lookahead == 'n') {
    return check_prefix(lexer, "no", 2, NO);
  } else if (valid_symbols[INV] && lexer->lookahead == 'i') {
    return check_prefix(lexer, "inv", 3, INV);
  } else if (valid_symbols[SET_ARGUMENT]) {
    while (!is_whitespace(lexer->lookahead)) {
      if (lexer->lookahead == '\\') {
        lexer->advance(lexer, false);
      }
      lexer->advance(lexer, false);
    }
    lexer->result_symbol = SET_ARGUMENT;
    return true;
  }

  return false;
}
