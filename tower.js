var debug = require('debug');
var utils = require('utils');

module.exports = function(tower) {
  if (!('towerTargets' in Memory)) {
    Memory.towerTargets = {};
  }

  if (tower.energy <= 0) {
    debug(tower, "Sad empty tower");
    Memory.towerTargets[tower.id] = null;
    return;
  }

  if (shoot(tower) == OK) return;
  if (heal(tower) == OK) return;
  if (repair(tower) == OK) return;
}

function shoot(tower) {
  var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  if (!target) {
    return ERR_INVALID_TARGET;
  }
  console.log(tower, "Tower found a target to shoot " + target.id);
  return tower.attack(target);
}

function repair(tower) {
  // Only repair if the tower's energy is 75%+
  if (tower.energy < tower.energyCapacity * 0.75) {
    return ERR_NOT_ENOUGH_ENERGY;
  }

  var repairTargets = tower.room.find(FIND_STRUCTURES, {
    filter: function(object) {
      if (!object.hits) {
        // Things without hit points can't be repaired
        return false;
      }
      if (object.hits == object.hitsMax) {
        return false;
      }
      if (object.structureType == STRUCTURE_ROAD) {
        // If it's a road, only repair if it's below 50%
        return object.hits < (object.hitsMax * 0.5);
      }
      if (object.structureType == STRUCTURE_WALL) {
        // Never repair walls?
        return false;
      }
      if (object instanceof OwnedStructure && !object.my) {
        return false;
      }

      // Otherwise repair things which are down by at least 1000 hp
      return object.hits <= object.hitsMax - 1000;
    }
  });

  if (!repairTargets || !repairTargets.length) {
    return ERR_INVALID_TARGET;
  }

  // Find the one with the lowest hits by %.
  var target = utils.maximize(repairTargets, function(target) {
    return -(target.hits / target.hitsMax);
  });

  return tower.repair(target);
}

function heal(tower) {
  return ERR_INVALID_TARGET;
}
