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
  if (repair(tower) == OK) return;
  if (heal(tower) == OK) return;
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
  var repairTargets = tower.room.find(FIND_STRUCTURES, {
    filter: function(object) {
      return object.hits && object.hits < object.hitsMax;
    }
  });

  if (!repairTargets || !repairTargets.length) {
    return ERR_INVALID_TARGET;
  }

  // Find the one with the lowest hits.
  var target = utils.maximize(repairTargets, function(target) {
    return -target.hits;
  });

  return tower.repair(target);
}

function heal(tower) {
  
}
