export const CANNON_RANGE = 25;
export const BASE_DURATION = 100;
export const TURN_DURATION = BASE_DURATION;
export const FIRE_DURATION = 3*BASE_DURATION;
export const SHOT_STEP = 50;
export const COCONUTS = 5;

export const MAX_CANNONBALLS = function(cannons: number) { return cannons+1; }
export const MAX_HP = function(cannons: number) { return 3 + (cannons>>1); }
export const GOLD = function() { return 5 + Math.floor(Math.random()*10); }
