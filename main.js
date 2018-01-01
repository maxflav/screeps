var build = require('build');
var creepsLib = require('creep');
var globals = require('globals');
var spawnLib = require('spawn');
var utils = require('utils');


module.exports.loop = function () {
  var errors = [];

  try {
    globals.resetTargetCounts();

    if (Math.random() < 0.01) {
      clearDeadCreeps();
    }

    var spawn = Game.spawns['Spawn1'];
    build(spawn.room);
  } catch (e) {
    errors.push(e);
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
