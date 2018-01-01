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

var debug = require('debug');
var globals = require('globals');
var sources = require('sources');
var utils = require('utils');

// If we get these results, invalidate my target
var BAD_RESULTS = [
  ERR_NOT_OWNER,
  ERR_NO_PATH,
  ERR_NAME_EXISTS,
  ERR_BUSY,
  ERR_NOT_FOUND,
  ERR_NOT_ENOUGH_ENERGY,
  ERR_NOT_ENOUGH_RESOURCES,
  ERR_INVALID_TARGET,
  ERR_FULL,
  ERR_INVALID_ARGS,
  ERR_NO_BODYPART,
  ERR_NOT_ENOUGH_EXTENSIONS,
  ERR_RCL_NOT_ENOUGH,
  ERR_GCL_NOT_ENOUGH,
];


module.exports = function run(creep) {
  if (Memory.debugAll || Memory.debug) {
    creep.say(creep.name);
  }

  var target = null;
  if (creep.memory.targetId) {
    target = Game.getObjectById(creep.memory.targetId);
  }

  if (target && Math.random() < 0.1) {
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

  var moveResult = creep.moveTo(target, {
    reusePath: 10,
    visualizePathStyle: { stroke: '#ffffff' }
  });
  var interactResult = interactWithTarget(creep, target);

  if (BAD_RESULTS.includes(moveResult) || BAD_RESULTS.includes(interactResult)) {
    debug(creep,
      "target=" + target +
      ", moveResult=" + moveResult +
      ", interactResult=" + interactResult +
      "; invalidating target.");

    globals.decrementTargetCount(target);
    target = null;
    creep.memory.targetId = null;
    utils.wander(creep, true);
  }

  considerMakingARoadHere(creep);
};

function isTargetValid(creep, target) {
  if (target instanceof Structure && !target.isActive()) {
    debug(creep, "structure is invalid because it's not active");
    return false;
  }

  var fullness = creep.carry.energy / creep.carryCapacity;

  if (target instanceof Structure) {
    if (target.hits < target.hitsMax && fullness > 0) {
      debug(creep, "structure is valid because we can repair it");
      // We can repair this!
      return true;
    }
  }

  if (target instanceof Source) {
    var valid = fullness < 1 && target.energy > 0;
    debug(creep, "source valid = " + valid + " because fullness = " + fullness + " & source.energy = " + target.energy);
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

  debug(creep, "getting new target");
  var target = null;
  if (creep.carry.energy <= creep.carryCapacity / 2) {
    debug(creep, "low on energy, will target a source");
    target = getNewTargetSource(creep);
    if (target != null) {
      debug(creep, "found this source: " + target.id);
      return target;
    }
    debug(creep, "found no valid source");

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
      return source.energy > 0 &&
        globals.getTargetCount(source) < sources.getSourceSlots(source);
    }
  });
}

var DUMP_TARGETS = [
  STRUCTURE_EXTENSION,
  STRUCTURE_SPAWN,
  STRUCTURE_TOWER
];

function getNewTargetEnergyDump(creep) {
  var closest = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: function(object) {
      var result =
        DUMP_TARGETS.includes(object.structureType) &&
        object.energy < object.energyCapacity &&
        object.isActive();
       return result;
    }
  });
  return closest;
}

var STRUCTURE_TYPES = [
  STRUCTURE_SPAWN,
  STRUCTURE_EXTENSION,
  STRUCTURE_TOWER,
  STRUCTURE_CONTAINER,
  STRUCTURE_RAMPART,
  STRUCTURE_WALL,
  STRUCTURE_ROAD,
];

var MAX_WORKERS_PER_CONSTRUCTION = {
  STRUCTURE_SPAWN: 5,
  STRUCTURE_EXTENSION: 5,
  STRUCTURE_TOWER: 3,
  STRUCTURE_CONTAINER: 3,
  STRUCTURE_RAMPART: 1,
  STRUCTURE_WALL: 1,
  STRUCTURE_ROAD: 1,
}

function getNewTargetConstructionSite(creep) {

  for (var i = 0; i < STRUCTURE_TYPES.length; i++) {
    var type = STRUCTURE_TYPES[i];
    var target = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES, {
      filter: function(object) {
        return object.structureType == type &&
               globals.getTargetCount(object) < MAX_WORKERS_PER_CONSTRUCTION[type];
      }
    });

    if (target != null) {
      return target;
    }
  }

  return null;
}

function getNewTargetToRepair(creep) {
  // Repairing towers is important
  var repairTarget = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: function(object) {
      return object.structureType == STRUCTURE_TOWER &&
             object.hits < object.hitsMax &&
             globals.getTargetCount(object) < 3;
    }
  });

  if (repairTarget) {
    return repairTarget;
  }

  // Otherwise creeps should rarely repair, let towers do it. Assuming towers can exist.
  if (creep.room.controller.level >= 3 && Math.random() < 0.9) {
    return;
  }

  repairTarget = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: function(object) {
      return object.hits < object.hitsMax &&
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
      dontCrowd(creep, target);
    }
    return buildResult;
  }

  if (DUMP_TARGETS.includes(target.structureType)) {
    return creep.transfer(target, RESOURCE_ENERGY);
  }

  if (target instanceof StructureController) {
    var upgradeResult = creep.upgradeController(target);
    if (upgradeResult == OK) {
      dontCrowd(creep, target);
    }
    return upgradeResult;
  }

  return ERR_INVALID_TARGET;
}

function dontCrowd(creep, target) {
  if (Math.random() > 0.3) {
    return;
  }

  var distance = utils.distance(creep, target);
  if (distance < 4) {
    utils.wander(creep, false);
  }
}

function considerMakingARoadHere(creep) {
  if (Math.random() < 0.001) {
    var lastWander = creep.memory.lastWanderTime;
    if (!lastWander || Game.time - lastWander > 20) {
      var madeRoad = creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
      console.log("Make a road at " + creep.name + "'s position: " + madeRoad);
    }
  }
}
