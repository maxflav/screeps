/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utils');
 * mod.thing == 'a thing'; // true
 */

var utils = {};

utils.distance = function(a, b) {
	return Math.max(Math.abs(a.pos.x - b.pos.x), Math.abs(a.pos.y - b.pos.y));
};

utils.wander = function(creep, idly) {
  var movements = [TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT];
  creep.move(utils.pick(movements));

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

utils.pick = function(list) {
  if (!list || !list.length) {
    return null;
  }
  return list[Math.floor(Math.random() * list.length)];
}

utils.maximize = function(list, func) {
  var bestItem = null;
  var bestScore = null;
  list.forEach(function(item) {
    var score = func(item);
    if (!bestItem || score > bestScore) {
      bestItem = item;
      bestScore = score;
    }
  });

  return bestItem;
}

module.exports = utils;
