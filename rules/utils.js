function key_val_arg(arg, ...args) {
  if (args.length > 0)
    return seq(field("name", arg), token.immediate("="), field("val", ...args));
  else return field("name", arg);
}

function maybe_bang($, cmd_name) {
  return seq(cmd_name, optional($.bang));
}

function keyword(gram, name) {
  return alias(gram["_" + name], name);
}

function command($, cmd, ...args) {
  return seq(keyword($, cmd), ...args);
}

module.exports = {
  command: command,
  keyword: keyword,
  maybe_bang: maybe_bang,
  key_val_arg: key_val_arg,
};
