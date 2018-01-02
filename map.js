var MAP = {};
var mapCache = {};

var EMPTY = 'empty';
var WALKABLE = 'walkable';
var BLOCKED = 'blocked';

MAP.EMPTY = EMPTY;
MAP.WALKABLE = WALKABLE;
MAP.BLOCKED = BLOCKED;

MAP.getType = function(room, x, y) {
  if (x in mapCache && y in mapCache[x]) {
    return mapCache[x][y];
  }

  var result = _getType(room, x, y);
  if (!(x in mapCache)) mapCache[x] = {};
  mapCache[x][y] = result;
  return result;
}

MAP.setType = function(room, x, y, type) {
  if (!(x in mapCache)) {
    mapCache[x] = {};
  }
  mapCache[x][y] = type;
}

module.exports = MAP;

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

  if (subtype == STRUCTURE_RAMPART) {
    return EMPTY;
  }

  if (OBSTACLE_OBJECT_TYPES.includes(subtype)) {
    return BLOCKED;
  } else {
    return WALKABLE;
  }
}
