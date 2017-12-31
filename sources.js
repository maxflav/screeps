var map = require('map');

module.exports = {};

module.exports.getSourceSlots = function(source) {
  if (!source) {
    return 0;
  }

  var room = source.room;
  if (!('sourceSlots' in room.memory)) {
    room.memory.sourceSlots = {};
  }
  var cached = room.memory.sourceSlots[source.id];
  if (cached) {
    return cached;
  }

  var x = source.pos.x;
  var y = source.pos.y;

  var slotsCount = 0;
  for (var dx = -1; dx <= 1; dx++) {
    var newX = x + dx;
    for (var dy = -1; dy <= 1; dy++) {
      if (dx == 0 && dy == 0) continue;
      var newY = y + dy;
      var type = map.getType(room, newX, newY);
      if (type != map.BLOCKABLE) {
        slotsCount++;
      }
    }
  }

  room.memory.sourceSlots[source.id] = slotsCount;
  return slotsCount;
}
