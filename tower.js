var debug = require('debug');

module.exports = function(tower) {
  if (tower.energy <= 0) {
    debug(tower, "Sad empty tower " + tower.id);
    return;
  }

  var result = shoot(tower);
  if (result != OK) {
    repair(tower);
  }
}

function shoot(tower) {
  var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  if (!target) {
    return ERR_INVALID_TARGET;
  }
  debug(tower, "Tower found a target " + target.id);
}

function repair(tower) {

}
