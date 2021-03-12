import { angleToOrientation } from "engine/utils.js"

import Island from "./island.js";
import PlayerShip from "./ship.js";


const HEADINGS = ["NW", "N", "NE", "E", "SE", "S", "SW", "W"];
const parent = document.querySelector("#status") as HTMLElement;

export default class Status {
	_ship!: PlayerShip;
	_target: Island | undefined;
	_dom: Record<string, HTMLElement> = {};

	constructor(ship: PlayerShip) {
		["target", "cannonballs", "hp", "gold", "coconuts"].forEach(id => {
			this._dom[id] = parent.querySelector(`#${id} dd`) as HTMLElement;
		}, this);

		this.ship = ship;
	}

	get ship() { return this._ship; }
	set ship(ship: PlayerShip) {
		this._ship = ship;
		this.update();
	}

	get target() { return this._target; }
	set target(target: Island | undefined) {
		this._target = target;
		this.update();
	}

	update() {
		this._dom["cannonballs"].innerHTML = String(this.ship.cannonballs);
		this._dom["hp"].innerHTML = new Array(this.ship.hp).fill("#").join("");
		this._dom["gold"].innerHTML = String(this.ship.gold);
		this._dom["coconuts"].innerHTML = String(this.ship.coconuts);

		let target = "(none)";
		if (this.target) {
			let island = this.target;
			target = island.name;
			let dir = [
				island.position[0] - this.ship.position[0],
				island.position[1] - this.ship.position[1]
			];
			let angle = Math.atan2(dir[1], dir[0]);
			let heading = HEADINGS[angleToOrientation(angle)];
			target = `${target} (${heading})`;
		}
		this._dom["target"].innerHTML = target;
	}
}
