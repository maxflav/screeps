var utils = require('utils');

module.exports = function(creep) {
  movement(creep);
  scouting(creep);
}

function movement(creep) {
  if (creep.memory.to) {
    var moved = creep.moveTo(new RoomPosition(creep.memory.to.x, creep.memory.to.y, creep.memory.to.room));
    if (moved == OK) {
      return;
    }
  }

  utils.wander(creep, false);

  // creep.room.
}

function scouting(creep) {

}
