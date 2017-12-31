// If I have a target, check that it is still valid.
// -- Source: if I have < full capacity energy
// -- Construction site: if I have > 0 energy
// -- Controller: if I have > 0 energy
// -- Extension: if I have > 0 energy and the extension is not full capacity
// -- Spawn: if I have > 0 energy and the spawn is not full capacity

// I have no target:
// - if I have <= 50% energy capacity, my target is a source. Just pick the closest one?
// - I have > 50% energy capacity.
// -- 1. harvest dump. Closest amongst unfilled extensions/spawn.
// -- 2. construction site.
// --- by type: Extension, tower, wall, road, ..., then by distance.
// -- 3. controller.

// I have a target:
// - Move toward it: `creep.moveTo(target, {reusePath: 5});`
// - Interact with it.

var globals = require('globals');
var utils = require('utils');

module.exports = function run(creep) {
  if (Memory.debugAll || Memory.debug == creep.id) {
    creep.say(creep.name);
  }

  var target = null;
  if (creep.memory.targetId) {
    target = Game.getObjectById(creep.memory.targetId);
  }

  if (target) {
    if (!isTargetValid(creep, target)) {
      globals.decrementTargetCount(target);
      creep.memory.targetId = null;
      target = null;
    }
  }

  if (!target) {
    target = getNewTarget(creep);
    if (!target) {
      // shrug
      utils.wander(creep, true);
      return null;
    }
    globals.incrementTargetCount(target);
    creep.memory.targetId = target.id;
  }

  // var posBefore = creep.pos;
  var moveResult = creep.moveTo(target, {
    reusePath: 10,
    visualizePathStyle: { stroke: '#ffffff' }
  });

  var interactResult = interactWithTarget(creep, target);
  // console.log(creep.name + " before moving, pos = " + creep.pos.x + ", " + creep.pos.y);
  // console.log(creep.name + " after moving, pos = " + creep.pos.x + ", " + creep.pos.y);
  // if (moveResult == OK && posBefore == creep.pos) {
  //   console.log(creep.name + " didn't move");
  //   moveResult = ERR_NO_PATH;
  // }

  if (interactResult != OK && moveResult != OK && moveResult != ERR_TIRED) {
    globals.decrementTargetCount(target);
    target = null;
    creep.memory.targetId = null;
    utils.wander(creep, true);
  }
};

function isTargetValid(creep, target) {
  if (target instanceof Structure && !target.isActive()) {
    debug(creep, creep.name + " structure is invalid because it's not active");
    return false;
  }

  var fullness = creep.carry.energy / creep.carryCapacity;

  if (target instanceof Structure) {
    if (target.hits < target.hitsMax && fullness > 0) {
      debug(creep, creep.name + " structure is valid because we can repair it");
      // We can repair this!
      return true;
    }
  }

  if (target instanceof Source) {
    var valid = fullness < 1 && target.energy > 0;
    // utils.debug(creep, creep.name + " source valid = " + valid + " because fullness = " + fullness + " & source.energy = " + target.energy);
    return valid;
  }

  if (target instanceof ConstructionSite ||
      target instanceof StructureController) {
    return fullness > 0;
  }

  if (target instanceof StructureSpawn ||
      target instanceof StructureExtension) {
    return fullness > 0 && target.energy < target.energyCapacity;
  }

  return false;
}

function getNewTarget(creep) {
  // - if I have <= 50% energy capacity, my target is a source. Just pick the closest one?
  // - I have > 50% energy capacity.
  // -- 1. harvest dump. Closest amongst unfilled extensions/spawn.
  // -- 2a. construction site.
  // --- by type: Extension, tower, wall, road, ..., then by distance.
  // -- 2b. repair something
  // -- 3. controller.

  utils.debug(creep, creep.name + " getting new target");
  var target = null;
  if (creep.carry.energy <= creep.carryCapacity / 2) {
    utils.debug(creep, creep.name + " low on energy, will target a source");
    target = getNewTargetSource(creep);
    utils.debug(creep, creep.name + " found this source: " + target.id);
    if (target != null) { return target; }

    if (creep.carry.energy == 0) {
      return null;
    }
  }

  var controller = creep.room.controller;
  if (controller.ticksToDowngrade < 2000 && globals.getTargetCount(controller) < 2) {
    return controller;    
  }

  target = getNewTargetEnergyDump(creep);
  if (target != null) { return target; }

  target = getNewTargetConstructionSite(creep);
  if (target != null) { return target; }

  target = getNewTargetToRepair(creep);
  if (target != null) { return target; }

  return controller;
}

function getNewTargetSource(creep) {
  return creep.pos.findClosestByRange(FIND_SOURCES, {
    filter: function(source) {
      return source.energy > 0 && globals.getTargetCount(source) < 3;
    }
  });
}

function getNewTargetEnergyDump(creep) {
  var closest = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: function(object) {
      var result =
        (object.structureType == STRUCTURE_EXTENSION ||
         object.structureType == STRUCTURE_SPAWN) &&
        object.energy < object.energyCapacity &&
        object.isActive();
       return result;
    }
  });
  return closest;
}

function getNewTargetConstructionSite(creep) {
  var structureTypes = [
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_TOWER,
    STRUCTURE_CONTAINER,
    STRUCTURE_RAMPART,
    STRUCTURE_WALL,
    STRUCTURE_ROAD,
  ];

  for (var i = 0; i < structureTypes.length; i++) {
    var type = structureTypes[i];
    var target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
      filter: function(object) {
        return object.structureType == type && globals.getTargetCount(object) <= 3;
      }
    });

    if (target != null) {
      return target;
    }
  }

  return null;
}

function getNewTargetToRepair(creep) {
  // Only target things that are < 50%
  var repairTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: function(object) {
      return object.structureType != STRUCTURE_WALL &&
             object.hits * 2 < object.hitsMax &&
             globals.getTargetCount(object) < 1;
    }
  });

  return repairTarget;
}

function interactWithTarget(creep, target) {
  if (target instanceof Structure) {
    if (target.hits < target.hitsMax && creep.carry.energy > 0) {
      var repairResult = creep.repair(target);
      if (repairResult == OK) {
        return OK;
      }
    }
  }

  if (target instanceof Source) {
    return creep.harvest(target);
  }

  if (target instanceof ConstructionSite) {
    var buildResult = creep.build(target);
    if (buildResult == OK) {
      if (Math.random() < 0.5) utils.wander(creep, true);
    }
    return buildResult;
  }

  if (target instanceof StructureSpawn ||
      target instanceof StructureExtension) {
    return creep.transfer(target, RESOURCE_ENERGY);
  }

  if (target instanceof StructureController) {
    var upgradeResult = creep.upgradeController(target);
    if (upgradeResult == OK) {
      if (Math.random() < 0.5) utils.wander(creep, false);
    }
    return upgradeResult;
  }

  return ERR_INVALID_TARGET;
}
