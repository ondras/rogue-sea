import { DIRS, angleToOrientation } from "engine/utils.js";

import Ship from "./ship.js";
import Sea from "./sea.js";
import Island from "./island.js";
import * as rules from "./rules.js";


type Point = [number, number];

function d(p1: Point, p2: Point) {
	return [p1[0]-p2[0], p1[1]-p2[1]].norm();
}

export abstract class Task {
	prerequisities: Task[] = [];
	constructor(readonly ship: Ship) {}
	abstract isDone(): boolean;

	perform(sea: Sea): number | Promise<number> {
		for (let p of this.prerequisities) {
			if (p.isDone()) { continue; }
			return p.perform(sea);
		}
		return -1;
	}
}

export class MoveToPoint extends Task {
	protected timesStuck = 0;

	constructor(ship: Ship, protected point: Point, readonly distance: number) {
		super(ship);
	}

	isDone() {
		let currentDist = d(this.ship.position, this.point);
		return (currentDist <= this.distance);
	}

	perform(sea: Sea) {
		const { ship, point, distance } = this;

		let dirs = [-1, 0, 1];
		if (this.timesStuck > 2) { dirs.push(-2, 2); console.log("cheat 1", ship); } // cheating!
		if (this.timesStuck > 3) { dirs.push(4); console.log("cheat 2", ship); } // more cheating!

		let candidates = dirs.map(diff => {
			let orientation = (ship.orientation + diff).mod(8);
			let dir = DIRS[orientation];
			let position: Point = [
				ship.position[0] + dir[0],
				ship.position[1] + dir[1]
			];
			let dist = d(position, point);
			return {orientation, position, score: Math.abs(dist - distance)};
		}).filter(candidate => {
			return ship.fits(sea, ship.position, candidate.orientation) // can rotate
				&& ship.fits(sea, candidate.position, candidate.orientation) // can move
		});

		if (!candidates.length) {
			this.timesStuck++;
			return -1;
		}

		candidates.sort((a, b) => a.score - b.score);
		this.timesStuck = 0;

		let candidate = candidates.shift()!;
		if (candidate.orientation == ship.orientation) { // forward
			let dx = candidate.position[0] - ship.position[0];
			let dy = candidate.position[1] - ship.position[1];
			ship.position = candidate.position;
			return rules.BASE_DURATION * [dx, dy].norm();
		} else { // rotate
			ship.orientation = candidate.orientation;
			return rules.TURN_DURATION;
		}
	}
}


class MoveToShip extends MoveToPoint {
	constructor(ship: Ship, readonly target: Ship, distance: number) {
		super(ship, target.position, distance);
	}

	isDone() {
		this.point = this.target.position;
		return super.isDone();
	}

	perform(sea: Sea) {
		this.point = this.target.position;
		return super.perform(sea);
	}
}


export class MoveToIsland extends Task {
	constructor(ship: Ship, readonly island: Island) {
		super(ship);
		this.prerequisities = [new MoveToPoint(ship, island.position, 0)];
	}

	isDone() { return this.ship.anchoredAt == this.island; }
}

class GetCannonballs extends Task {
	isDone() { return (this.ship.cannonballs > 0); }

	perform(sea: Sea) {
		if (this.prerequisities.length == 0) { // pick island
			let island = sea.islands.filter(island => island.type == "cannonballs").random();
			this.prerequisities = [
				new MoveToIsland(this.ship, island)
			];
		}
		return super.perform(sea);
	}
}

export class RepairShip extends Task {
	isDone() { return (this.ship.hp >= this.ship.maxHP); }

	perform(sea: Sea) {
		if (this.prerequisities.length == 0) { // pick island
			let island = sea.islands.filter(island => island.type == "repair").random();
			this.prerequisities = [
				new MoveToIsland(this.ship, island)
			];
		}
		return super.perform(sea);
	}
}

class BroadsideTowards extends Task {
	constructor(ship: Ship, readonly target: Ship) {
		super(ship);
	}

	isDone() {
		let dir = this.orientationToTarget();
		let dist = (dir - this.ship.orientation).mod(4)
		return (dist == 2);
	}

	perform(sea: Sea) {
		const { ship } = this;

		let dir = this.orientationToTarget();
		let candidates = [-1, 1].map(diff => {
			let orientation = (ship.orientation + diff).mod(8);
			let leftDistance = (orientation+2 - dir).mod(4);
			let rightDistance = (orientation-2 - dir).mod(4);
			let distance = Math.min(leftDistance, rightDistance);
			return { orientation, distance };
		}).filter(candidate => {
			return ship.fits(sea, ship.position, candidate.orientation) // can rotate
		});
		if (candidates.length == 0) { return -1; } // cannot rotate anywhere :/

		candidates.sort((a, b) => a.distance - b.distance);
		ship.orientation = candidates.shift()!.orientation;
		return rules.TURN_DURATION;
	}

	protected orientationToTarget() {
		const { ship, target } = this;

		let dx = target.position[0] - ship.position[0];
		let dy = target.position[1] - ship.position[1];

		let angle = Math.atan2(dy, dx);
		return angleToOrientation(angle);
	}
}

export class Attack extends Task {
	constructor(ship: Ship, readonly target: Ship) {
		super(ship);

		this.prerequisities = [
			// ensure enough cannonballs
			new GetCannonballs(ship),
			// move within range
			new MoveToShip(ship, target, rules.CANNON_RANGE),
			// rotate if necessary
			new BroadsideTowards(ship, target)
		];
	}

	isDone() { return !this.target.alive; }

	async perform(sea: Sea) {
		const { ship, target } = this;

		for (let p of this.prerequisities) {
			if (p.isDone()) { continue; }
			return p.perform(sea);
		}

		let cannons = ship.cannons.map(cannon => {
			let position = ship.getCannonPosition(cannon);
			if (!position) {
				return { cannon, distance: Infinity };
			}
			let dx = target.position[0] - position[0];
			let dy = target.position[1] - position[1];
			let distance = [dx, dy].norm();
			return { cannon, distance };
		});
		cannons.sort((a, b) => a.distance - b.distance);

		let cannon = cannons.shift()!;
		await ship.fire(cannon.cannon, sea);
		return rules.FIRE_DURATION;
	}
}
