var map = require('map');
var utils = require('utils');

var BUILD_THESE = [
  STRUCTURE_EXTENSION,
  STRUCTURE_TOWER
];

module.exports = function(room) {
  if (Math.random() < 0.9) {
    return;
  }

  var controller = room.controller;
  var level = controller.level;

  BUILD_THESE.forEach(function(type) {
    var limit = CONTROLLER_STRUCTURES[type][level];
    makeSureWeHave(room, limit, type);
  });

  if (CONTROLLER_STRUCTURES[STRUCTURE_RAMPART][level] > 0) {
    buildRamparts(room);
  }
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
      source = utils.pick(sources);
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

    if (map.getType(room, pos.x, pos.y) == map.EMPTY &&
      !hasBlockedAdjacent &&
      (pos.x + pos.y) % 2 == 1
    ) {
      var distanceFromSource = utils.distancePos(pos, source.pos);
      if (distanceFromSource > 3) {
        map.setType(room, pos.x, pos.y, map.BLOCKED);
        return pos;
      }
    }
  }
  
  return null;
}

var PROTECT_STRUCTURES = [
  STRUCTURE_TOWER,
  STRUCTURE_SPAWN,
  STRUCTURE_CONTROLLER,
]

function buildRamparts(room) {
  // var exits = room.find(FIND_EXIT);
  // var protectStructures = room.find(FIND_MY_STRUCTURES, {
  //   filter: function(object) {
  //     return PROTECT_STRUCTURES.includes(object.structureType);
  //   }
  // });

  var structurePositions = protectStructures.map(function(structure) { return structure.pos; });
  // var protectPositions = exits.concat(structurePositions);
  var protectPositions = structurePositions;

  var potentialRampartPositions = [];

  protectPositions.forEach(function(pos) {
    for (var dx = -2; dx <= 2; dx++) {
      var x = pos.x + dx;
      if (x <= 0 || x >= 49) continue;
      for (var dy = -2; dy <= 2; dy++) {
        var y = pos.y + dy;
        if (y <= 0 || y >= 49) continue;
        if (map.isRampart(room, x, y)) {
          continue;
        }
        potentialRampartPositions.push({x: x, y: y});
      }
    }
  });

  for (var i = 0; i < 5; i++) {
    var pos = utils.pick(potentialRampartPositions);
    console.log("Attempting to build a rampart at " + pos.x + ", " + pos.y);
    room.createConstructionSite(pos.x, pos.y, STRUCTURE_RAMPART);
  }
}
