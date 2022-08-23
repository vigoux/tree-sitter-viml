# Contributing to this repository

Hey, and thank you for wanting to help me build this project !

There is still quite a lot to do, and the main axes of improvements
are:

- Add support for more builtin commands: the list of currently
  supported builtin commands can be found in the [scanner file]
- Add support for language constructs: like `let` variants for
  unpacking.

## Adding a new builtin command

To add a new command, you only need to modify the [grammar], by doing
the following:

1. In the `extras` key of the grammar, within the `make_keywords`
   call, add the following in the dictionnary argument:
```js
<UPPERCASE UNIQUE NAME> = {
  rule = $._<rule name>,
  mandat = "<mandatory part of the command>",
  opt = "<optional part of the command>",
  ignore_comments_after = true|false <whether the parser needs to ignore comments after this command>
}
```
2. Add a new rule named `<command name>_statement` in the grammar,
   and add it to the `statement` rule. To use the command keyword, do
   `tokalias($, "<command name>")`.
3. Add a test for your command in a custom file in the `test/corpus`
   directory.
4. Add highlighting for this command in [the highlight query], and
   test it in [the highlight tests].

Then open a pull request, and you'll be good to go !

## Adding new language constructs

It should be sufficient to just modify the `grammar.js` for that,
adding the appropriate rules.

Be mindful though that you need to handle the command separators on
your own, using the `$._cmd_separator` rule.

[scanner file]: ./src/scanner.c
[grammar]: ./grammar.js
[the highlight query]: ./queries/highlights.scm
[the highlight tests]: ./test/highlight/
