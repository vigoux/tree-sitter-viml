# Contributing to this repository

Hey, and thank you for wanting to help me build this project !

There is still quite a lot to do, and the main axes of improvements
are:

- Add support for more builtin commands: the list of currently
  supported builtin commands can be found in the [scanner file]
- Add support for language constructs: like `let` variants for
  unpacking.

## Adding a new builtin command

First, you will need to edit the [scanner file] to include
your new command:

1. Add a new `enum` variant with the name of your command in the
   `TokenType` enum, just before `UNKNOWN_COMMAND`.
2. Add your keyword in the `keywords[]` variable, using the `KEYWORD`
   macro, with the arguments:
   1. The `TokenType` you entered above
   2. The mandatory part of the command (before the `[]` in the command help)
   3. The optional part of the command (inside `[]` in the command help)
   4. Whether text after a `"` isn't ignored (`true`) or is considered as a comment (`false`)
3. Edit the `grammar.js`:
   1. Add your command in `externals`, above `$.unknown_command_name`, prefixed by a `_`
   2. Create your command rule in the grammar; to include the command keyword, do the following : `tokalias($, "command name")`.
4. Add a test for your command in a custom file in the `test/corpus`
   directory.

Then open a pull request, and you'll be good to go !

## Adding new language constructs

It should be sufficient to just modify the `grammar.js` for that,
adding the appropriate rule.

[scanner file]: ./src/scanner.c
