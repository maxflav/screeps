var EXTENSION_LIMIT_PER_LEVEL = {
  2: 5,
  3: 10,
  4: 20,
  5: 30,
  6: 40,
  7: 50,
  8: 60,
};

module.exports = function(room) {
  // return;

  var controller = room.controller;
  var level = controller.level;
  var extensionLimit = EXTENSION_LIMIT_PER_LEVEL[level] || 0;

  var numBuiltExtensions = room.find(FIND_MY_STRUCTURES, {
    filter: function(object) {
      return object.structureType == STRUCTURE_EXTENSION;
    }
  }).length;

  var numConstructingExtensions = room.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: function(object) {
      return object.structureType == STRUCTURE_EXTENSION;
    }
  }).length;  

  var numExtensions = numBuiltExtensions + numConstructingExtensions;
  if (numExtensions >= extensionLimit) {
    return;
  }

  console.log("We only have " + numExtensions + " extensions but we can have " + extensionLimit + " at level " + level);

  var numToMake = extensionLimit - numExtensions;
  for (var i = 0; i < numToMake; i++) {
    var pos = findANiceSpot(room);
    console.log("Creating an extension at " + pos.x + ", " + pos.y);
    room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION);
  }
};


var EMPTY = 'empty';
var WALKABLE = 'walkable'; // walkable means there is no building/wall/creep, but roads are ok
var BLOCKED = 'blocked';

var mapCache = {};
var source;

var positionStack;

function findANiceSpot(room) {
  // Start at a source, then walk randomly (not thru walls/structures) until:
  // - we are not inside anything else
  // - we get to a space which has at most one neighboring structure or creep
  // - not next to the source

  if (!positionStack || !positionStack.length) {
    if (!source) {
      var sources = room.find(FIND_SOURCES);

      if (!sources || !sources.length) {
        source = room.controller;
      } else {
        source = sources[0];
      }
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
        var type = getType(room, x, y);
        if (type == BLOCKED) {
          if (dx == 0 || dy == 0) hasBlockedAdjacent = true;
        } else {
          if (!visited[x][y]) {
            positionStack.push({x: x, y: y});
            visited[x][y] = true;
          }
        }
      }
    }

    if (getType(room, pos.x, pos.y) == EMPTY && !hasBlockedAdjacent) {
      var distanceFromSource = Math.abs(pos.x - source.pos.x) + Math.abs(pos.y - source.pos.y);
      if (distanceFromSource > 3) {
        mapCache[pos.x][pos.y] = BLOCKED;
        return pos;
      }
    }
  }
  
  return null;
}

function getType(room, x, y) {
  if (x in mapCache && y in mapCache[x]) {
    return mapCache[x][y];
  }

  var result = _getType(room, x, y);
  if (!(x in mapCache)) mapCache[x] = {};
  mapCache[x][y] = result;
  return result;
}

function _getType(room, x, y) {
  var lookResults;
  try {
    lookResults = room.lookAt(x, y);
  } catch (e) {
    return BLOCKED;
  }

  for (var lookIndex = 0; lookIndex < lookResults.length; lookIndex++) {
    var lookResult = lookResults[lookIndex];
    if (_typeOfLookResult(lookResult) == BLOCKED) {
      return BLOCKED;
    }
  }

  for (var lookIndex = 0; lookIndex < lookResults.length; lookIndex++) {
    var lookResult = lookResults[lookIndex];
    if (_typeOfLookResult(lookResult) == WALKABLE) {
      return WALKABLE;
    }
  }

  return EMPTY;
}

function _typeOfLookResult(lookResult) {
  var subtype;

  if (lookResult.type == LOOK_CREEPS) return WALKABLE;
  else if (lookResult.type == LOOK_ENERGY) return WALKABLE;
  else if (lookResult.type == LOOK_RESOURCES) return WALKABLE;
  else if (lookResult.type == LOOK_SOURCES) return BLOCKED;
  else if (lookResult.type == LOOK_MINERALS) return BLOCKED;
  else if (lookResult.type == LOOK_STRUCTURES) {
    subtype = lookResult.structure.structureType;
  }
  else if (lookResult.type == LOOK_FLAGS) return WALKABLE;
  else if (lookResult.type == LOOK_CONSTRUCTION_SITES) {
    subtype = lookResult.constructionSite.structureType;
  }
  else if (lookResult.type == LOOK_NUKES) return WALKABLE;
  else if (lookResult.type == LOOK_TERRAIN) {
    subtype = lookResult.terrain;
    if (subtype == 'plain') {
      return EMPTY;
    }
  }

  if (OBSTACLE_OBJECT_TYPES.includes(subtype)) {
    return BLOCKED;
  } else {
    return WALKABLE;
  }
}
