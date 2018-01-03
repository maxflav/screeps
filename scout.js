var utils = require('utils');

module.exports = function(creep) {
  movement(creep);
  scouting(creep);
}

function movement(creep) {
  if (!tryToMove(creep)) {
    creep.memory.to = getNewTarget(creep);
  }
  if (!tryToMove(creep)) {
    utils.wander(creep, false);
  }
}

function tryToMove(creep) {
  if (!creep.memory.to) {
    return false;
  }
  if (Math.random() < 0.01) {
    // Don't get stuck forever
    return false;
  }
  if (creep.room.name == creep.memory.to.room && Math.random() < 0.25) {
    // I'm already in the room I wanted to go to
    return false;
  }

  var moved = creep.moveTo(new RoomPosition(creep.memory.to.x, creep.memory.to.y, creep.memory.to.room));
  if (moved == OK) {
    return true;
  } else {
    return false;
  }
}

function getNewTarget(creep) {
  return null;
}

function scouting(creep) {

}
