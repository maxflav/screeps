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
var _ = require('lodash');

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
  creep.notifyWhenAttacked(false);
  if (creep.spawning) {
    return;
  }

  if (Memory.debugAll || Memory.debug) {
    creep.say(creep.name);
  }

  var target = null;
  if (creep.memory.targetId) {
    debug(creep, "has this targetId: " + creep.memory.targetId);
    if (creep.memory.targetId.length < 10) {
      target = new RoomPosition(25, 25, creep.memory.targetId);
    } else {
      target = Game.getObjectById(creep.memory.targetId);
    }
  }

  if (target) {
    if (!isTargetValid(creep, target)) {
      debug(creep, "target is not valid " + target);
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
    if (target instanceof RoomPosition) {
      creep.memory.targetId = target.roomName;
    } else {
      creep.memory.targetId = target.id;
    }
    globals.incrementTargetCount(creep.memory.targetId);
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

  considerMakingARoadHere(creep, target);
};

function isTargetValid(creep, target) {
  if (target instanceof Structure && !target.isActive()) {
    debug(creep, "structure is invalid because it's not active");
    return false;
  }

  var fullness = _.sum(creep.carry) / creep.carryCapacity;

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

  if (target instanceof Resource) {
    var valid = fullness < 1 && target.amount > 0;
    debug(creep, "resource valid = " + valid + " because fullness = " + fullness + " & resource.amount = " + target.amount);
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

  if (target instanceof RoomPosition) {
    // remote rooms are valid if it's not the current room
    return target.roomName != creep.room.name;
  }

  if (target instanceof Creep) {
    // A creep is a valid target to attack if it's an enemy in the same room and I can attack
    return !target.my && target.room == creep.room && (creep.getActiveBodyparts(ATTACK) > 0);
  }

  return false;
}

function getNewTarget(creep) {
  // - enemies to attack?
  // - if I have <= 20% energy capacity, my target is a source. Just pick the closest one?
  // - I have > 20% energy capacity.
  // -- 1. harvest dump. Closest amongst unfilled extensions/spawn.
  // -- 2a. construction site.
  // --- by type: Extension, tower, wall, road, ..., then by distance.
  // -- 2b. repair something
  // -- 3. controller.

  debug(creep, "getting new target");
  var target = null;

  target = getNewTargetEnemyCreep(creep);
  if (target != null) { return target; }

  if (creep.carry.energy <= creep.carryCapacity / 5) {
    debug(creep, "low on energy, will target a source");
    target = getNewTargetSource(creep);
    if (target != null) {
      debug(creep, "found this source: " + target.id);
      return target;
    }
    debug(creep, "found no valid source");

    if (creep.carry.energy == 0) {
      return getNewTargetRemoteMine(creep);
    }
  }

  if (!creep.room.controller.my) {
    debug(creep.name + " is lost!");
    if (creep.memory.home) {
      return Game.rooms[creep.memory.home].controller;
    }
    var rooms = Object.values(Game.rooms);
    for (var i = 0; i < rooms.length; i++) {
      var room = rooms[i];
      if (room.controller && room.controller.my) {
        return room.controller;
      }
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

function getNewTargetEnemyCreep(creep) {
  if (creep.getActiveBodyparts(ATTACK) == 0) {
    return null;
  }

  // focus on the enemy with ATTACK.
  // If none have ATTACK, then no need to fight anything. unless you feel like it
  var hostiles = creep.room.find(FIND_HOSTILE_CREEPS);

  var baddies = hostiles.filter(function(hostile) {
    return hostile.getActiveBodyparts(ATTACK) > 0;
  })
  if (baddies.length > 0) {
    return utils.pick(baddies);
  }

  if (hostiles.length > 0 && Math.random() < 0.15) {
    return utils.pick(hostiles);
  }
}

function getNewTargetSource(creep) {
  var foundResource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
    filter: function(resource) {
      var distance = utils.distance(creep, resource);
      return resource.amount > distance + 50 &&
        globals.getTargetCount(resource) < 1;
    }
  });

  if (foundResource) return foundResource;

  return creep.pos.findClosestByRange(FIND_SOURCES, {
    filter: function(source) {
      return source.energy > 0 &&
        globals.getTargetCount(source) < sources.getSourceSlots(source);
    }
  });
}

function getNewTargetRemoteMine(creep) {
  debug(creep, "Thinking about remote mines");
  if (!Memory.scoutInfo) {
    return null;
  }

  var roomNames = Object.keys(Memory.scoutInfo).filter(function(name) {
    var numSources = Memory.scoutInfo[name].sources;
    if (!numSources || numSources <= 0) {
      return false;
    }

    var assignedHere = globals.getTargetCount(name);
    return (assignedHere < numSources);
  });

  if (!roomNames.length) {
      return null;
  }
  debug(creep, "Considering these remote mines " + JSON.stringify(roomNames));

  var picked = utils.minimize(roomNames, function(room) {
    var assignedHere = globals.getTargetCount(room);
    var numSources = Memory.scoutInfo[room].sources;
    var dist = utils.roomDist(room, creep.room);

    return dist * 100 - numSources + assignedHere;
  });
  debug(creep, "Picked this one: " + picked);
  return new RoomPosition(25, 25, picked);
}

var DUMP_TARGETS = [
  STRUCTURE_EXTENSION,
  STRUCTURE_SPAWN,
  STRUCTURE_TOWER
];

var MAX_DUMPERS_PER_TYPE = {}
MAX_DUMPERS_PER_TYPE[STRUCTURE_SPAWN] = 3;
MAX_DUMPERS_PER_TYPE[STRUCTURE_EXTENSION] = 1;
MAX_DUMPERS_PER_TYPE[STRUCTURE_TOWER] = 1;

function getNewTargetEnergyDump(creep) {
  var closest = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: function(object) {
      var type = object.structureType;

      var result =
        DUMP_TARGETS.includes(type) &&
        object.energy < object.energyCapacity &&
        globals.getTargetCount(object) < MAX_DUMPERS_PER_TYPE[type] &&
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
  STRUCTURE_STORAGE,
  STRUCTURE_RAMPART,
  STRUCTURE_WALL,
  STRUCTURE_ROAD,
];

var MAX_WORKERS_PER_CONSTRUCTION = {};
MAX_WORKERS_PER_CONSTRUCTION[STRUCTURE_SPAWN] = 5;
MAX_WORKERS_PER_CONSTRUCTION[STRUCTURE_EXTENSION] = 5;
MAX_WORKERS_PER_CONSTRUCTION[STRUCTURE_TOWER] = 3;
MAX_WORKERS_PER_CONSTRUCTION[STRUCTURE_CONTAINER] = 3;
MAX_WORKERS_PER_CONSTRUCTION[STRUCTURE_STORAGE] = 3;
MAX_WORKERS_PER_CONSTRUCTION[STRUCTURE_RAMPART] = 1;
MAX_WORKERS_PER_CONSTRUCTION[STRUCTURE_WALL] = 1;
MAX_WORKERS_PER_CONSTRUCTION[STRUCTURE_ROAD] = 1;

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
  if (target instanceof RoomPosition) {
    return OK;
  }

  if (target instanceof Structure) {
    if (target.hits < target.hitsMax && creep.carry.energy > 0) {
      var repairResult = creep.repair(target);
      if (repairResult == OK) {
        return OK;
      }
    }
  }

  if (target instanceof Resource) {
    return creep.pickup(target);
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

  if (target instanceof Creep) {
    return creep.attack(target);
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

function considerMakingARoadHere(creep, target) {
  if (!target || target instanceof ConstructionSite) {
    return;
  }

  if (creep.carry.energy == 0) {
    return;
  }

  if ((creep.pos.x + creep.pos.y) % 2 != 0) {
    return;
  }

  if (Math.random() < 0.001) {
    var madeRoad = creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
    console.log("Make a road at " + creep.name + "'s position: " + madeRoad);
  }
}
