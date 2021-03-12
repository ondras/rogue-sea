import Entity from "engine/entity.js";
import { Actor } from "engine/timeloop.js";
import { DIRS } from "engine/utils.js";

import Sea from "./sea.js";
import Island from "./island.js";
import Captain from "./captain.js";
import Player from "./player.js";
import * as log from "./log.js";
import * as audio from "./audio.js";
import * as rules from "./rules.js";


type Point = [number, number];

export default class Ship extends Entity implements Actor<Sea> {
	captain?: Captain;
	anchoredAt?: Island;

	readonly maxCannonballs = rules.MAX_CANNONBALLS(this.cannons.length);
	readonly maxHP = rules.MAX_HP(this.cannons.length);
	cannonballs = this.maxCannonballs;
	hp = this.maxHP;

	name = randomName();
	gold = rules.GOLD();

	get alive() { return this.hp > 0; }

	async act(sea: Sea) {
		let time = rules.BASE_DURATION;
		if (this.captain) { time = await this.captain.act(sea); }

		await this.updateAnchor(sea); // check if we arrived to an island

		return time;
	}

	get cannons() {
		let avail = ["1", "4", "7", "3", "6", "9"];
		let cannons: string[] = [];
		const bitmap = this.bitmaps[this.orientation];

		bitmap.data.forEach(row => {
			row.forEach(item => {
				if (!item) { return; }
				avail.includes(item.type) && cannons.push(item.type);
			});
		});

		return cannons;
	}

	async fire(cannon: string, sea: Sea) {
		let position = this.getCannonPosition(cannon);
		if (!position) { return null; }

		this.cannonballs--;
		audio.sfx("cannon", position);
		this.notifyFire(cannon);

		let diff = (Number(cannon) % 3 ? -2 : 2);
		let o = (this.orientation + diff).mod(8);

		let shot = sea.createShot();
		let target = await shot.fly(position, o);

		this.notifyFireTarget(target);

		if (target instanceof Ship) { target.hit(this, sea); }

		return target;
	}

	hit(attacker: Ship, sea: Sea) {
		this.hp--;
		if (this.alive) {
			this.captain && this.captain.notifyHit(attacker);
		} else {
			this.die(sea, attacker);
			attacker.captain && attacker.captain.loot(this);
		}
	}

	getCannonPosition(cannon: string): Point | null {
		const bitmap = this.bitmaps[this.orientation];
		let position: Point | null = null;

		const [px, py] = [
			this.position[0] - bitmap.origin[0],
			this.position[1] - bitmap.origin[1]
		];

		bitmap.data.forEach((row, sy) => {
			row.forEach((item, sx) => {
				if (!item) { return; }
				if (item.type != cannon) { return; }
				position = [sx + px, sy + py];
			});
		});

		return position;
	}

	protected die(sea: Sea, attacker: Ship) {
		sea.remove(this);
		this.notifyDeath(attacker);

		sea.createAnotherShip(this);
	}

	protected updateAnchor(sea: Sea) {
		let dir = DIRS[this.orientation];
		let position: Point = [
			this.position[0] + dir[0],
			this.position[1] + dir[1]
		];
		let islandFound!: Island;
		this.footprint(point => {
			let queried = sea.query(point);
			if (queried instanceof Island) { islandFound = queried; }
		}, position, this.orientation);
		if (this.anchoredAt != islandFound) { return this.anchorAt(islandFound); }
	}

	protected anchorAt(island?: Island) {
		this.anchoredAt = island;
		if (!island) { return; }

		if (island.type == "cannonballs") { this.cannonballs = this.maxCannonballs; }
		if (island.type == "repair") { this.hp = this.maxHP; }
	}

	// this ship fired a cannon
	protected notifyFire(_cannon: string) {
		let hear = ["hear", "'earr"].random();
		let where = ["", " in the distance"].random();
		log.text(`Ya ${hear} a cannon shootin'${where}.`, "cannon-shot");
	}

	// this ship's shot found a target
	protected notifyFireTarget(target: Ship | Island | null) {
		if (target instanceof PlayerShip) {
			let hit = ["is hit", "be 'it"].random();
			log.swear(`Yer ship ${hit}!`);
		}
	}

	// this ship is sunk
	protected notifyDeath(attacker: Ship) {
		let name = (attacker instanceof PlayerShip ? "She" : this.name);
		log.text([
			`${name} goes down!`,
			`${name} is sunk!`,
			`${name} be down!`,
			`${name} be down to Davy Jones' Locker!`
		].random());
	}
}

export class PlayerShip extends Ship {
	captain?: Player;
	coconuts = 0;

	get position() { return super.position; }

	set position(position: Point) {
		this._position = position;
		if (this.renderer) { this.renderer.center = position; }
	}

	protected die(sea: Sea, attacker: Ship) {
		sea.remove(this);
		this.notifyDeath(attacker);
		sea.stop();
	}

	protected anchorAt(island?: Island) {
		super.anchorAt(island);
		if (!island) { return; }

		log.text(`Ye anchor yer ship at ${island.name}.`);

		if (island.type == "cannonballs") {
			log.text(`Yer cannons be loaded with cannonballs.`);
		} else if (island.type == "repair") {
			log.text(`Yer ship, ${this.name}, gets 'er deck fixed right away.`);
		} else if (island.type == "coconut" && this.captain && this.captain.target == island) {
			this.coconuts++;
			let type = ["sweet", "large", "tasty", "yummy"].random();
			log.text(`Ye collect a ${type} coconut.`);
		} else {
			log.text("There be nothin' to see 'ere.");
		}

		if (this.captain && this.captain.target == island) { return this.captain.targetFound(); }
	}

	protected notifyFire(cannon: string) {
		let side = (Number(cannon) % 3 ? "port" : "starboard");
		let you = ["Ye", "Ya"].random();
		let adj = ["the ol'", "the rusty", "yer trusty"].random();
		log.text(`${you} fire ${adj} cannon to the ${side} side.`);
	}

	protected notifyFireTarget(target: Ship | Island | null) {
		if (target instanceof Ship) {
			log.text([
				`The shot ${["'its", "hits"].random()} ${target.name}.`,
				`${target.name} be ${["'it", "hit"].random()} by the shot.`,
			].random());
		}

		if (target instanceof Island) {
			log.text(`The shot crashes into ${target.name}.`);
		}

		if (!target) {
			let hit = ["'it", "hit"].random();
			log.text([
				`${["The", "Yer"].random()} shot misses.`,
				`Ya do not ${hit} anythin'.`
			].random());
		}
	}
}


const NAMES = ["Boaty", "Booty", "Pearl", "Betty", "Folly", "Jewel", "Blade", "Monkee", "Rose"];

function randomName() {
	let name = NAMES.random();
	return [
		`${name} Mc${name}face`,
		`Old ${name}`,
		`Jolly ${name}`,
		`${name}'s Fortune`,
		`Bloody ${name}`,
		`Royal ${name}`,
	].random();
}
