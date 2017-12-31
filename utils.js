/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utils');
 * mod.thing == 'a thing'; // true
 */

var utils = {};

utils.getDistance = function(a, b) {
	return Math.max(Math.abs(a.pos.x - b.pos.x), Math.abs(a.pos.y - b.pos.y));
};

utils.wander = function(creep, idly) {
  var movements = [TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT];
  var rnd = Math.floor(Math.random() * movements.length);
  creep.move(movements[rnd]);

  if (idly) {
    creep.say(creep.name + '?');
    creep.memory.lastWanderTime = Game.time;
  }
}

utils.debug = function(object, str) {
  if (Memory.debugAll || Memory.debug == object.id) {
    console.log(str);
  }
}

module.exports = utils;
