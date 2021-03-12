import Renderer from "engine/renderer.js";
import Entity from "engine/entity.js";
import World from "engine/world.js";
import TimeLoop from "engine/timeloop.js";
import { DIRS, angleToOrientation } from "engine/utils.js";

import Ship from "./ship.js";
import Island from "./island.js";
import Water from "./water.js";
import Shot from "./shot.js";
import Captain from "./captain.js";
import * as shipyard from "./shipyard.js";


type Point = [number, number];

export default class Sea extends World {
	readonly ships: Ship[] = [];
	readonly islands: Island[] = [];
	readonly timeLoop = new TimeLoop();

	constructor(renderer: Renderer) {
		super(renderer, new Water(renderer));
		window.sea = this;
	}

	start(timeScale: number) {
		this.timeLoop.timeScale = timeScale;
		return this.timeLoop.start(this);
	}
	stop() { return this.timeLoop.stop(); }

	add(entity: Entity) {
		switch (true) {
			case entity instanceof Ship:
				let ship = entity as Ship;
				this._add(ship, this.ships, 2);
				this.timeLoop.add(ship);
			break;

			case entity instanceof Island:
				(entity as Island).updateBackground(this.bg);
				this._add(entity as Island, this.islands, 1);
			break;
		}
	}

	remove(entity: Entity) {
		switch (true) {
			case entity instanceof Ship:
				let ship = entity as Ship;
				this.timeLoop.remove(ship);
				this._remove(ship, this.ships);
			break;

			case entity instanceof Island:
				this._remove(entity as Island, this.islands);
			break;
		}
	}

	_add<T extends Entity>(entity: T, list: T[], layer: number) {
		list.push(entity);
		this.renderer.add(entity, layer);
		entity.renderer = this.renderer;
	}

	_remove<T extends Entity>(entity: T, list: T[]) {
		entity.renderer = undefined;
		this.renderer.remove(entity);
		let index = list.indexOf(entity);
		list.splice(index, 1);
	}

	has(ship: Ship) {
		return this.ships.includes(ship);
	}

	query(point: Point) {
		let ship = this.ships.find(ship => ship.query(point));
		if (ship) { return ship; }

		let island = this.islands.find(island => island.blocks(point));
		if (island) { return island; }

		return null;
	}

	positionNear(entity: Entity, point: Point) {
		let angle = Math.atan2(point[1], point[0]);
		let orientation = angleToOrientation(angle);

		entity.orientation = orientation;
		let dir = DIRS[orientation];
		point = point.slice() as Point; // copy

		while (1) { // move away from the point
			if (entity.fits(this, point, entity.orientation)) { break; }
			point[0] += dir[0];
			point[1] += dir[1];
		}

		// one step further
		point[0] += dir[0];
		point[1] += dir[1];

		// just to make sure
		while (1) {
			if (entity.fits(this, point, entity.orientation)) { break; }
			point[0] += dir[0];
			point[1] += dir[1];
		}

		// set the final position
		entity.position = point;
	}

	createShot() {
		let shot = new Shot(this.renderer, this);
		this.renderer.add(shot, 3);
		return shot;
	}

	createAnotherShip(ship: Ship) {
		let size = [0, 1, 2].random();
		let newShip = shipyard.create({size, pc:false});
		if (ship.captain) { newShip.captain = new Captain(newShip, ship.captain.personality); }

		this.positionNear(ship, this.islands.random().position);
		this.add(ship);
	}
}

