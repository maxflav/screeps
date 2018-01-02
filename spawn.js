var CREEPS_LIMIT = 6;

module.exports = function(spawn) {
  if (!spawn) {
    return;
  }

  if (spawn.spawning != null) {
    return;
  }

  if (Math.random() < 0.9) {
    return;
  }

  var availableEnergy = spawn.room.energyAvailable;
  if (spawn.room.energyAvailable < 300) {
    return;
  }

  var myCreeps = Object.values(Game.creeps).filter(function(creep) { return creep.room == spawn.room });
  var numCreeps = myCreeps.length;
  if (numCreeps >= CREEPS_LIMIT) {
    return;
  }

  // If we are only 1-2 creeps away from CREEPS_LIMIT, let's wait until we are at full capacity
  if (CREEPS_LIMIT - numCreeps <= 2 && availableEnergy < spawn.room.energyCapacityAvailable) {
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
