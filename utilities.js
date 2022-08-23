function keyword(gram, name) {
  return alias(gram["_" + name], name);
}

function maybe_bang($, cmd_name) {
  return seq(cmd_name, optional($.bang));
}

function command($, cmd, ...args) {
  return seq(keyword($, cmd), ...args);
}

function bang_command($, cmd, ...args) {
  return seq(maybe_bang($, keyword($, cmd)), ...args);
}

function key_val_arg(arg, ...args) {
  if (args.length > 0)
    return seq(field("name", arg), token.immediate("="), field("val", ...args));
  else return field("name", arg);
}

module.exports = {
  command,
  bang_command,
  keyword,
  maybe_bang,
  key_val_arg,
};
