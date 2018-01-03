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
  if (creep.room.controller && creep.room.controller.my) {
    // I already own this room
    return;
  }

  if (!Memory.scoutInfo) {
    Memory.scoutInfo = {};
  }

  if (creep.room.name in Memory.scoutInfo && Math.random() < 0.99) {
    return;
  }

  var available = isRoomAvailable(creep);
  if (!available) {
    Memory.scoutInfo[creep.room.name] = { sources: 0 };
    return;
  }

  Memory.scoutInfo[creep.room.name] = {
    sources: countSources(creep)
  };
}

function isRoomAvailable(creep) {
  if (creep.room.controller) {
    if (creep.room.controller.owner || creep.room.controller.reservation) {
      return false;
    }
  }

  var hostileTowers = countHostileTowers(creep);
  if (hostileTowers > 0) {
    return false;
  }

  var hostileAttackCreeps = countHostileAttackCreeps(creep);
  if (hostileAttackCreeps > 0) {
    return false;
  }

  return true;
}

function countHostileTowers(creep) {
  return creep.room.find(FIND_HOSTILE_STRUCTURES, {
    filter: function(object) {
      return object.structureType == STRUCTURE_TOWER;
    }
  });
}

function countHostileAttackCreeps(creep) {
  return creep.room.find(FIND_HOSTILE_CREEPS, {
    filter: function(enemy) {
      return enemy.getActiveBodyparts(ATTACK) > 0 || enemy.getActiveBodyparts(RANGED_ATTACK) > 0;
    }
  });
}

function countSources(creep) {
  return creep.room.find(FIND_SOURCES).length;
}
