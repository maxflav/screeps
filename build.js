var map = require('map');
var utils = require('utils');

module.exports = function(room) {
  var controller = room.controller;
  var level = controller.level;
  var extensionLimit = EXTENSION_LIMIT_PER_LEVEL[level] || 0;
  var towerLimit = TOWER_LIMIT_PER_LEVEL[level] || 0;

  makeSureWeHave(room, towerLimit, STRUCTURE_TOWER);
  makeSureWeHave(room, extensionLimit, STRUCTURE_EXTENSION);
}

var EXTENSION_LIMIT_PER_LEVEL = {
  1: 0,
  2: 5,
  3: 10,
  4: 20,
  5: 30,
  6: 40,
  7: 50,
  8: 60,
};

var TOWER_LIMIT_PER_LEVEL = {
  1: 0,
  2: 0,
  3: 1,
  4: 1,
  5: 2,
  6: 2,
  7: 3,
  8: 6,
}

function makeSureWeHave(room, limit, type) {
  var numBuilt = room.find(FIND_MY_STRUCTURES, {
    filter: function(object) {
      return object.structureType == type;
    }
  }).length;

  var numConstructing = room.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: function(object) {
      return object.structureType == type;
    }
  }).length;  

  var total = numBuilt + numConstructing;
  if (total >= limit) {
    return;
  }

  console.log("We only have " + total + " " + type + "s but we can have " + limit + " in " + room.name);

  var numToMake = limit - total;
  for (var i = 0; i < numToMake; i++) {
    var pos = findANiceSpot(room, type);

    if (pos) {
      console.log("Creating a " + type + " at " + pos.x + ", " + pos.y);
      room.createConstructionSite(pos.x, pos.y, type);
    } else {
      console.log("Couldn't find anywhere to place a " + type + " in " + room.name + "!");
    }
  }
};


var source;

var positionStack;

function findANiceSpot(room, type) {
  // Start at a source, then walk randomly (not thru walls/structures) until:
  // - we are not inside anything else
  // - we get to a space which has at most one neighboring structure or creep
  // - not next to the source

  if (!positionStack || !positionStack.length) {
    if (!source && type == STRUCTURE_EXTENSION) {
      var sources = room.find(FIND_SOURCES);
      source = utils.pickOne(sources);
    }
    if (!source) {
      source = room.controller;
    }

    positionStack = [{x: source.pos.x, y: source.pos.y}];
  }
  var visited = {};

  while (positionStack.length > 0) {
    // Swap at random
    var swap = Math.floor(Math.random() * positionStack.length);
    var tmp = positionStack[swap];
    positionStack[swap] = positionStack[positionStack.length-1];
    positionStack[positionStack.length-1] = tmp;

    var pos = positionStack.pop();
    var hasBlockedAdjacent = false;

    for (var dx = -1; dx <= 1; dx++) {
      var x = pos.x + dx;
      if (!(x in visited)) {
        visited[x] = {};
      }

      for (var dy = -1; dy <= 1; dy++) {
        if (dx == 0 && dy == 0) continue;

        var y = pos.y + dy;
        var type = map.getType(room, x, y);
        if (type == map.BLOCKED) {
          if (dx == 0 || dy == 0) hasBlockedAdjacent = true;
        } else {
          if (!visited[x][y]) {
            positionStack.push({x: x, y: y});
            visited[x][y] = true;
          }
        }
      }
    }

    if (map.getType(room, pos.x, pos.y) == map.EMPTY && !hasBlockedAdjacent) {
      var distanceFromSource = utils.distance(pos, source.pos);
      if (distanceFromSource > 3) {
        map.setType(room, pos.x, pos.y, map.BLOCKED);
        return pos;
      }
    }
  }
  
  return null;
}
