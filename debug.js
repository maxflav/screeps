module.exports = function(object, str) {
  if (Memory.debugAll || Memory.debug == object.id) {
    console.log(object + str);
  }
}
