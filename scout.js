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

  var moved = creep.moveTo(new RoomPosition(creep.memory.to.x, creep.memory.to.y, creep.room.name));
  if (moved == OK) {
    return true;
  } else {
    return false;
  }
}

function getNewTarget(creep) {
  var exits = creep.room.find(FIND_EXIT);
  if (!exits || !exits.length) {
    return null;
  }
  return utils.pick(exits);
}

function scouting(creep) {

}
