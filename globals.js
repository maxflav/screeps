var targetCounts = {};

var globals = {
  resetTargetCounts: function() {
    targetCounts = {};

    var creeps = Object.values(Game.creeps);
    creeps.forEach(function(creep) {
      globals.incrementTargetCountById(creep.memory.targetId);
    });
  },

  incrementTargetCountById: function(targetId) {
    if (!targetId) return;
    if (!targetCounts[targetId]) {
      targetCounts[targetId] = 1;
    } else {
      targetCounts[targetId]++;
    }
  },

  incrementTargetCount: function(target) {
    if (!target) return;
    var id = target.id;
    if (target instanceof RoomPosition) {
      id = target.roomName;
    }
    globals.incrementTargetCountById(target.id);
  },

  decrementTargetCountById: function(targetId) {
    if (!targetId) return;
    if (!targetCounts[targetId]) {
      console.log("Was trying to decrement target id which didn't exist? " + targetId);
      targetCounts[targetId] = 0;
    } else {
      targetCounts[targetId]--;
    }
  },

  decrementTargetCount: function(target) {
    if (!target) return;
    var id = target.id;
    if (target instanceof RoomPosition) {
      id = target.roomName;
    }
    globals.decrementTargetCountById(id);
  },

  getTargetCountById: function(targetId) {
    if (!targetId) return 0;
    if (!targetCounts[targetId]) return 0;
    return targetCounts[targetId];
  },

  getTargetCount: function(target) {
    if (!target) return 0;
    var id = target.id;
    if (target instanceof RoomPosition) {
      id = target.roomName;
    }
    return globals.getTargetCountById(id);
  }
};

module.exports = globals;
