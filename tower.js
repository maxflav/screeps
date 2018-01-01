var debug = require('debug');

module.exports = function(tower) {
  if (tower.energy <= 0) {
    console.log(tower, "Sad empty tower " + tower.id);
    return;
  }

  if (shoot(tower) == OK) return;
  if (repair(tower) == OK) return;
  if (heal(tower) == OK) return;
}

function shoot(tower) {
  var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  if (!target) {
    return ERR_INVALID_TARGET;
  }
  console.log(tower, "Tower found a target to shoot " + target.id);
  return tower.attack(target);
}

function repair(tower) {

}

function heal(tower) {
  
}
