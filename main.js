var globals = require('globals');
var creepsLib = require('creep');
var build = require('build');


module.exports.loop = function () {
  if (Math.random() < 0.1) {
    clearDeadCreeps();
  }

  var spawn = Game.spawns['Spawn1'];
  globals.resetTargetCounts();
  build(spawn.room);

  for (var name in Game.creeps) {
    var creep = Game.creeps[name];
    creepsLib(creep);
    
    if (Math.random() < 0.001) {
      var lastWander = creep.memory.lastWanderTime;
      if (!lastWander || Game.time - lastWander > 20) {
        var madeRoad = creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
        console.log("Make a road at " + creep.name + "'s position: " + madeRoad);
      }
    }
  }

  if (spawn.spawning != null) {
    return;
  }

  var availableEnergy = spawn.energy;
  var extensions = spawn.room.find(FIND_MY_STRUCTURES, {
    filter: function(object) {
      return object.structureType == STRUCTURE_EXTENSION
        && object.energy > 0
        && object.isActive();
    }
  });

  extensions.forEach(function(extension) {
    availableEnergy += extension.energy;
  });

  if (availableEnergy < 300 || Object.values(Game.creeps).length >= 8) {
    return;
  }
  
  var name = '';
  var num = Game.time % (26 * 26 * 26);
  for (var c = 0; c < 3; c++) {
    name += String.fromCharCode(65 + num % 26);
    num /= 26;
  }

  var parts = [MOVE, WORK, CARRY];
  availableEnergy -= 200;

  var partToAddIndex = 0;
  while (parts.length < 50 && availableEnergy >= BODYPART_COST[parts[partToAddIndex]]) {
    var addingPart = parts[partToAddIndex];
    partToAddIndex++;
    parts = parts.concat(addingPart);
    availableEnergy -= BODYPART_COST[addingPart];
  }
  if (availableEnergy >= 50) {
    parts.push(CARRY);
  }

  console.log('Spawning ' + name + ' with ' + parts);
  result = Game.spawns['Spawn1'].spawnCreep(parts, name);

  if (result != OK) {
    console.log('Failed to create ' + name + ': ' + result);
  }
}

function clearDeadCreeps() {
  for (var name in Memory.creeps) {
    if(!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log('Clearing non-existing creep memory:', name);
    }
  }
}
