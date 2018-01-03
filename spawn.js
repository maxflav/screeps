var WORKER_LIMIT = 6;
var SCOUTS_LIMIT = 1;

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

  var myCreeps = Object.values(Game.creeps).filter(function(creep) {
    return !creep.memory.home || creep.memory.home == spawn.room.name
  });

  var numWorkers = 0;
  var numScouts = 0;
  myCreeps.forEach(function(creep) {
    if (creep.memory.scout) {
      numScouts++;
    } else {
      numWorkers++;
    }
  });

  if (numScouts < SCOUTS_LIMIT) {
    var name = 'Scout ';
    var num = (Game.time + 8788) % (26 * 26 * 26);
    for (var c = 0; c < 3; c++) {
      name += String.fromCharCode(65 + num % 26);
      num /= 26;
    }

    console.log('Spawning a scout ' + name + ' with ' + parts);
    result = Game.spawns['Spawn1'].spawnCreep([MOVE], name, {memory: {home: spawn.room.name, scout: true}});
  }

  if (numWorkers >= WORKER_LIMIT) {
    return;
  }

  // If we are only 1-2 creeps away from WORKER_LIMIT, let's wait until we are at full capacity
  if (WORKER_LIMIT - numWorkers <= 2 && availableEnergy < spawn.room.energyCapacityAvailable) {
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
  result = Game.spawns['Spawn1'].spawnCreep(parts, name, {memory: {home: spawn.room.name}});

  if (result != OK) {
    console.log('Failed to create ' + name + ': ' + result);
  }
}
