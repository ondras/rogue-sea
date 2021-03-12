import { DIRS } from "engine/utils.js";

import Level from "./level.js";
import Captain from "./captain.js";
import Sea from "./sea.js";
import Status from "./status.js";
import Ship, { PlayerShip } from "./ship.js";
import Island from "./island.js";
import * as log from "./log.js";
import * as keyboard from "./keyboard.js";
import * as rules from "./rules.js";
import * as audio from "./audio.js";


type Point = [number, number];

export default class Player extends Captain {
	protected status: Status;
	protected _target?: Island;

	constructor(readonly ship: PlayerShip, protected level: Level) {
		super(ship, "");
		this.status = new Status(ship);
	}

	get target() { return this._target; }
	set target(target: Island | undefined) {
		this._target = target;
		this.status.target = target;
	}

	async act(sea: Sea) {
		log.newline();
		this.status.update();

		while (true) {
			let event = await keyboard.wait();
			let result = await this.processEvent(event, sea);
			if (result) {
				this.status.update();
				return result;
			}
		}
	}

	protected async processEvent(event: KeyboardEvent, sea: Sea) {
		switch (true) {
			case (event.key == "ArrowUp"):
			case (event.code == "KeyW"):
				return this.tryForward(sea); break;
			case (event.key == "ArrowLeft"):
			case (event.code == "KeyA"):
				return this.tryTurn(-1, sea); break;
			case (event.key == "ArrowRight"):
			case (event.code == "KeyD"):
				return this.tryTurn(+1, sea); break;
			case [" ", ".", "Enter"].includes(event.key): return rules.BASE_DURATION; break;

		}

		if (this.ship.cannons.includes(event.key)) {
			return this.tryFiring(event.key, sea);
		}

		return 0;
	}

	protected tryForward(sea: Sea) {
		let diff = DIRS[this.ship.orientation];
		let position: Point = [
			this.ship.position[0] + diff[0],
			this.ship.position[1] + diff[1]
		];
		if (!this.ship.fits(sea, position, this.ship.orientation)) {
			let way = ["path", "way"].random();
			log.swear(`Somethin' be blockin' the ${way}.`, "no-forward");
			return 0;
		}

		this.ship.position = position;
		return 100 * diff.norm();
	}

	protected tryTurn(diff: 1 | -1, sea: Sea) {
		let o = (this.ship.orientation + diff).mod(8);
		if (!this.ship.fits(sea, this.ship.position, o)) {
			let turn = ["to turn", "for turnin'"].random();
			log.swear(`There be no space ${turn} that way.`, "no-rotate");
			return 0;
		}

		this.ship.orientation = o;
		return rules.TURN_DURATION;
	}

	protected async tryFiring(cannon: string, sea: Sea) {
		if (!this.ship.cannonballs) {
			log.swear("Ye have no cannonballs to fire!", "no-cannonballs");
			return 0;
		}

		await this.ship.fire(cannon, sea);
		return rules.FIRE_DURATION;
	}

	loot(ship: Ship) {
		audio.tada();

		if (ship.cannonballs > 0) {
			if (Math.random() > 0.5) {
				this.lootCannonballs(ship);
			} else {
				this.lootGold(ship);
			}
		} else {
			this.lootGold(ship);
		}
	}

	protected lootCannonballs(ship: Ship) {
		this.ship.cannonballs = Math.min(this.ship.maxCannonballs, this.ship.cannonballs + ship.cannonballs);
		log.text("Ye salvage some useful cannonballs from the wreck.");
	}

	protected lootGold(ship: Ship) {
		this.ship.gold += ship.gold;
		log.text(`Ye salvage <span class='gold'>${ship.gold} gold</span> from the wreck.`);
	}

	targetFound() {
		this.status.update();
		return this.level.targetFound();
	}
}
