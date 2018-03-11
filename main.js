var build = require('build');
var creepsLib = require('creep');
var globals = require('globals');
var scout = require('scout');
var spawnLib = require('spawn');
var towerLib = require('tower');
var utils = require('utils');


module.exports.loop = function () {
  var errors = [];

  try {
    globals.resetTargetCounts();
  } catch (e) {
    errors.push(e);
  }

  var spawns = Object.values(Game.spawns);
  var rooms = spawns.map(function(spawn) { return spawn.room; });

  // var rooms = Object.values(Game.rooms);

  var towers = [];
  rooms.forEach(function(room) {
    towers = towers.concat(room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}}));
  });
  for (var i = 0; i < towers.length; i++) {
    var tower = towers[i];
    try {
      towerLib(tower);
    } catch (e) {
      errors.push(e);
    }
  }

  for (var name in Game.creeps) {
    var creep = Game.creeps[name];

    try {
      if (creep.memory.scout) {
        scout(creep);
      } else {
        creepsLib(creep);
      }
    } catch (e) {
      errors.push(e);
    }
  }

  spawns.forEach(function(spawn) {
    try {
      spawnLib(spawn);
      build(spawn.room);
    } catch (e) {
      errors.push(e);
    }

  });

  clearDeadCreeps();

  if (errors.length > 0) {
    errors.forEach(function(e) { console.log(e); });
    throw utils.pick(errors);
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
