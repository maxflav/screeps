module.exports = function(object, str) {
  if (!Memory.debugAll && !Memory.debug) return;
  if (Memory.debugAll || Memory.debug == object.id || Memory.debug == object.name) {
    console.log(object + " " + str);
  }
}
