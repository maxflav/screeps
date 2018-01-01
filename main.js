var build = require('build');
var creepsLib = require('creep');
var globals = require('globals');
var spawnLib = require('spawn');
var towerLib = require('tower');
var utils = require('utils');


module.exports.loop = function () {
  var errors = [];
  var spawn = Game.spawns['Spawn1'];
  var room = spawn.room;

  try {
    globals.resetTargetCounts();
  } catch (e) {
    errors.push(e);
  }

  var towers = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
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
      creepsLib(creep);
    } catch (e) {
      errors.push(e);
    }
  }

  try {
    spawnLib(spawn);
    build(room);
    if (Math.random() < 0.01) {
      clearDeadCreeps();
    }
  } catch (e) {
    errors.push(e);
  }

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
