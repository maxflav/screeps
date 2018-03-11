var utils = {};

utils.distancePos = function(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
};

utils.distance = function(a, b) {
	return utils.distancePos(a.pos, b.pos);
};

utils.wander = function(creep, idly) {
  var movements = [TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT];
  creep.move(utils.pick(movements));

  if (idly) {
    creep.say('?');
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

var roomRegex = /([EW])([0-9]+)([NS])([0-9]+)/;

utils.roomDist = function(room1, room2) {
  var parts1 = roomRegex.exec(room1);
  var parts2 = roomRegex.exec(room2);

  if (!parts1 || !parts2 || parts1.length < 5 || parts2.length < 5) {
    console.log("Couldn't decode room names " + room1 + ", " + room2);
    return 10000;
  }

  function coord(dir, num) {
    var sign = 1;
    if (dir == "W" || dir == "S") {
      sign = -1;
    }
    return sign * num;
  }

  var xdist = Math.abs(coord(parts1[1], parts1[2]) - coord(parts2[1], parts2[2]));
  var ydist = Math.abs(coord(parts1[3], parts1[4]) - coord(parts2[3], parts2[4]));
  return xdist + ydist;
}

module.exports = utils;
