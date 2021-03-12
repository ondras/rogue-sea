import { Actor } from "engine/timeloop.js";

import Ship from "./ship.js";
import Sea from "./sea.js";
import * as rules from "./rules.js";
import { Task, MoveToIsland, Attack, RepairShip } from "./task.js";


export type Personality = "merchant" | "corsair" | "";

export default class Captain implements Actor<Sea> {
	tasks: Task[] = [];
	constructor(readonly ship: Ship, readonly personality: Personality) {
	}

	async act(sea: Sea): Promise<number> {
		let index = this.tasks.length;
		while (index --> 0) {
			let task = this.tasks[index];

			if (task.isDone()) { // done -> remove from stack
				this.tasks.splice(index, 1);
				continue;
			}

			let result = await task.perform(sea);
			if (result == -1) { continue; } // cannot be completed ATM, try something else
			return result;
		}

		// nothing can be completed :-(

		if (this.tasks.length >= 3) { return rules.BASE_DURATION; } // pointless to add more

		// add another and re-try
		switch (this.personality) {
			case "merchant":
				this.goRandomIsland(sea);
			break;

			case "corsair":
				if (this.ship.hp < this.ship.maxHP) {
					let task = new RepairShip(this.ship);
					this.tasks.push(task);
				} else {
					let target = sea.ships.filter(s => s != this.ship).random();
					let task = new Attack(this.ship, target);
					this.tasks.push(task);
				}
			break;
		}
		return this.act(sea);
	}

	protected goRandomIsland(sea: Sea) {
		let island = sea.islands.filter(i => this.ship.anchoredAt != i).random();
		let task = new MoveToIsland(this.ship, island);
		this.tasks.push(task);
	}

	notifyHit(attacker: Ship) {
		let attackTasks = this.tasks.filter(task => task instanceof Attack && task.target == attacker);
		if (attackTasks.length > 0) { return; } // we are already attacking this ship

		if (this.personality == "corsair" || Math.random() > 0.5) {
			let task = new Attack(this.ship, attacker);
			this.tasks.push(task);
		}
	}

	loot(ship: Ship) {
		this.ship.cannonballs = Math.min(this.ship.maxCannonballs, this.ship.cannonballs + ship.cannonballs);
	}
}
