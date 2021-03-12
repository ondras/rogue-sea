export const CANNON_RANGE = 25;
export const BASE_DURATION = 100;
export const TURN_DURATION = BASE_DURATION;
export const FIRE_DURATION = 2*BASE_DURATION;
export const SHOT_STEP = 50;
export const MAX_CANNONBALLS = function(cannons: number) { return cannons; } // FIXME
export const MAX_HP = function(cannons: number) { return cannons+2; } // FIXME
export const GOLD = function() { return 3 + Math.floor(Math.random()*7); }