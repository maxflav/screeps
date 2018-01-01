module.exports = function(object, str) {
  if (Memory.debugAll || Memory.debug == object.id) {
    var prefix = "[" + object + "] ";
    console.log(prefix + str);
  }
}
