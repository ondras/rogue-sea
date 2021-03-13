import Port from "engine/port.js";
import { sleep } from "engine/utils.js";

import Island from "./island.js";
import Captain, { Personality } from "./captain.js";
import { PlayerShip } from "./ship.js";
import Player from "./player.js";
import Sea from "./sea.js";
import * as keyboard from "./keyboard.js";
import * as shipyard from "./shipyard.js";
import * as log from "./log.js";
import { COCONUTS } from "./rules.js";


type Point = [number, number];

export type Difficulty = 0 | 1 | 2 | 3;


export default class Level {
	protected player: Player;
	protected sea: Sea;
	todo: string[] = [];

	constructor(protected difficulty: 0 | 1 | 2 | 3, gold: number, protected port: Port) {
		this.sea = new Sea(port.renderer);
		populate(this.sea, difficulty);

		if (difficulty == 0) { this.todo = ["repair", "cannonballs", "coconut"]; }

		let pship = this.sea.ships.filter(s => s instanceof PlayerShip)[0] as PlayerShip;
		pship.gold = gold;
		this.player = new Player(pship, this);
	}

	async targetFound() {
		const { player, sea, difficulty, todo } = this;

		if (difficulty == 0) {
			if (todo.length > 0) {
				await this.showTutorialStep(todo.shift()!);
			} else {
				sea.stop();
			}
		} else {
			if (player.ship.coconuts >= COCONUTS) {
				sea.stop();
			} else {
				player.target = sea.islands.filter(i => i.type == "coconut" && i != player.ship.anchoredAt).random();
			}
		}
	}

	async play() {
		const { port, difficulty, player, sea } = this;

		if (difficulty == 0) {
			let wantsTutorial = await this.showDemo();
			if (!wantsTutorial) {
				port.renderer.clear();
				return player.ship;
			}
		}

		await this.showIntro();
		await sea.start(0);
		await this.showOutro();
		port.renderer.clear();

		return player.ship;
	}

	protected async showDemo() {
		const { port, player, sea } = this;

		sea.start(0.1);

		await sleep(5000);
		let key = await this.showTutorial("<strong>Ahoy an' ye be welcome to the Rogue Sea!</strong> 🦜", "Press <kbd>Enter</kbd> to learn about this game. If you are an experienced pirate, you can press <kbd>Esc</kbd> to skip the tutorial and start playing right away.");
		sea.stop();

		let aside = document.querySelector("aside") as HTMLElement;
		if (key == "Escape") { // directly swap to next level
			aside.classList.remove("narrow");
			port.sync();
			return false;
		} else { // slow transition
			aside.classList.add("transition");
			aside.classList.remove("narrow");
			await port.panAndZoomTo(player.ship.position);
			return true;
		}
	}

	protected async showIntro() {
		const { difficulty, port, player } = this;

		port.renderer.center = player.ship.position;
		player.ship.captain = player;

		switch (difficulty) {
			case 0:
				await this.showTutorial(`This is yer ship, the ${player.ship.name}. Be not she nice?\n\nLet's get to learnin' the sailin' then!`);

				log.newline();
				log.text("Movement: <kbd>&larr;</kbd> <kbd>&uarr;</kbd> <kbd>&rarr;</kbd> / <kbd>A</kbd> <kbd>W</kbd> <kbd>D</kbd> / <kbd>H</kbd> <kbd>K</kbd> <kbd>L</kbd>");
				await this.showTutorial(`Use <kbd>&larr;</kbd> <kbd>&uarr;</kbd> <kbd>&rarr;</kbd> or <kbd>A</kbd> <kbd>W</kbd> <kbd>D</kbd> keys to move yer ship around.<br/>Ye can use <kbd>H</kbd> <kbd>K</kbd> <kbd>L</kbd> keys as well, if ye be that kind of pirate.`);

				await this.showTutorial(`It be not possible to go backwards! So take jolly care not to get stuck. If ye get stuck, ye be cursed!`);

				log.newline();
				log.text("Wait: <kbd>Space</kbd> / <kbd>Enter</kbd> / <kbd>.</kbd>");
				await this.showTutorial(`Skippin' a turn might be useful. Ye can wait by hittin' <kbd>Space</kbd> or <kbd>Enter</kbd> or <kbd>.</kbd> key.`);

				log.newline();
				log.text("Zoom: <kbd>&plus;</kbd> / <kbd>&minus;</kbd>");
				await this.showTutorial(`Finally, ye can change the map size usin' the <kbd>&plus;</kbd> and <kbd>&minus;</kbd> keys.`);

				await this.targetFound(); // schedule next target
			break;

			case 1:
				await this.showTutorial(`From now on, ye be on yer own! Start with this here small ship an' collect ${COCONUTS} coconuts before movin' to a bigger sea.`);
				await this.targetFound();
				await this.showTutorial(`A coconut island be always shown as yer target to aid with navigation. Good luck, matey!`);
			break;

			case 2:
				await this.targetFound();
				await this.showTutorial(`Ye 'ave earned a middle-sized ship. She 'as more firepower, so do not be afraid to take on them other ships around. Yer goal be again to gather ${COCONUTS} coconuts.`);
			break;

			case 3:
				await this.targetFound();
				await this.showTutorial(`This here be the biggest boat that there sailed these seas. Show yer piratey skills an' try to loot as much <span class='gold'>gold</span> as possible. The game will end once ye reach ${COCONUTS} coconuts.`);
			break;
		}

	}

	protected async showOutro() {
		const { player, difficulty } = this;

		const endNote = "Press <kbd>Enter</kbd> to reload the game and try again";

		if (!player.ship.alive) {
			return this.showTutorial(`<strong>Scurvy! Yer ship been sent to Davy Jones' locker!</strong>\n\nYe managed to loot <span class='gold'>${player.ship.gold} gold</span> in yer pirate career.`, endNote);
		}

		switch (difficulty) {
			case 0:
				await this.showTutorial("Nice work, yer training is complete. Ye can start plain' the regular game now.");
			break;

			case 1:
				await this.showTutorial("Ye've proven yerself in this here small sea. Time to go lookin' fer a bigger one&hellip;");
			break;

			case 2:
				await this.showTutorial("All coconuts collected! Ye be truly gettin' into the pirate's way o' life.");
			break;

			case 3:
				await this.showTutorial(`<strong>Congratulations, matey!</strong>\n\nYe survived and completed the game, lootin' <span class='gold'>${player.ship.gold} gold</span> from other ships! Good luck in yer feature voyages.`, endNote);
			break;
		}
	}

	protected async showTutorialStep(step: string) {
		const { player, sea } = this;

		switch (step) {
			case "repair": {
				let island = sea.islands.filter(i => i.type == "repair").random();
				player.target = island;
				await this.showTutorial(`This part o' the sea is peaceful, but yer ship has taken some damage and needs fixin'.\n\nA carpenter lives at <strong>${island.name}</strong>, sail there an' pay 'em a visit.`);
			} break;

			case "cannonballs": {
				await this.showTutorial(`Now she be lookin' like new! Pay attention to islands where ye can repair yer ship. Repaired ships can take more poundin' by enemy cannons. \n\nSpeakin' of cannons, let's check them out now, shall we?`);
				await this.showTutorial(`Yer ship has cannons represented by a number. Bigger ships 've more cannons. Ye can shoot those by pressin' a number key, but it won't work without cannonballs!`);
				let island = sea.islands.filter(i => i.type == "cannonballs").random();
				player.target = island;
				await this.showTutorial(`To load more cannonballs, ye need to visit an island with a weaponsmith. <strong>${island.name}</strong> would be a jolly place to go now.`);
			} break;

			case "coconut": {
				await this.showTutorial(`Cannons be loaded, arrr! Ye can reload every time ye arrive to a cannonball island, but remember that bigger ships can 'old more cannonballs.`);
				await this.showTutorial(`Fightin' other ships be a life of a true pirate! Ye can loot cannonbals or even <span class='gold'>gold</span> from a sunken ship. Just take care ye do not end at Davy Jones' Locker!`);
				let island = sea.islands.filter(i => i.type == "coconut").random();
				player.target = island;
				await this.showTutorial(`Ye can always make a fortune by hoardin' coconuts. Try goin' fer one to <strong>${island.name}</strong> now.`);
			} break;
		}
	}

	protected async showTutorial(text: string, note?: string) {
		let node = document.createElement("div");
		node.id = "tutorial";
		node.innerHTML = text.replace(/\n/g, "<br/>") + `<br/><br/><em>${note || "Press <kbd>Enter</kbd> to continue"}</em>`;
		node.style.opacity = "0";
		this.port.parent.appendChild(node);

		await sleep(1);
		node.style.opacity = "1";

		let keys = ["Enter"];
		if (note) { keys.push("Escape"); }
		let key = await keyboard.waitFor(...keys);
		node.remove();
		return key
	}
}


export function populate(sea: Sea, difficulty: Difficulty) {
	// empty islands
	let R = 70 + difficulty*10;
	let islandCount = 6 + difficulty * 2;
	createIslands(R, islandCount).forEach(island => sea.add(island));

	// island types
	let islands = sea.islands.slice();
	islands.pop()!.type = "cannonballs";
	islands.pop()!.type = "cannonballs";
	islands.pop()!.type = "repair";
	islands.pop()!.type = "repair";

	let isStarting;
	if (difficulty == 0) {
		isStarting = (i: Island) => (i.type == "coconut");
	} else {
		isStarting = (i: Island) => (i.type != "coconut");
	}

	// player-starting island
	islands = sea.islands.filter(isStarting).sort((a, b) => { // sort by distance to center, descending
		let da = a.position.norm();
		let db = b.position.norm();
		return db-da;
	});
	let pisland = islands.shift()!;

	// player ship
	let size = Math.max(difficulty-1, 0);
	let pship = shipyard.create({size, pc: true});
	if (difficulty == 0) {
		pship.cannonballs = 0;
		pship.hp >>= 1; // half
	}
	sea.positionNear(pship, pisland.position); // position before adding -> do not center
	sea.add(pship);

	// other ships
	islands = sea.islands.filter(i => i != pisland).shuffle();
	let otherShips = 3 + difficulty;
	let corsairCount = difficulty;
	for (let i=0;i<otherShips;i++) {
		let sizes = [0, 1];
		if (difficulty > 1) { sizes.push(2); }
		let size = sizes.random();

		let ship = shipyard.create({size, pc: false});
		sea.positionNear(ship, islands.shift()!.position);
		sea.add(ship);

		let personality: Personality = (i < corsairCount ? "corsair" : "merchant");
		ship.captain = new Captain(ship, personality);
	}
}

function createIslands(R: number, islandCount: number) {
	const D2R = Math.PI/180;
	let positions: Point[] = [];

	for (let r of [R*0.45, R]) {
		let step = 3000 / r;
		for (let a=r; a<360+r; a+=step) {
			positions.push([
				Math.round(r*Math.cos(a*D2R)) + offset(),
				Math.round(r*Math.sin(a*D2R)) + offset()
			]);
		}
	}

	positions = positions.shuffle();
//	console.log("Available island positions", positions.length);

	let islands: Island[] = [];
	while (islandCount --> 0) {
		let island = new Island();
		island.position = positions.shift() as Point;
		islands.push(island);
	}

	return islands;
}

function offset() {
	return Math.floor(5*(Math.random() - 0.5));
}
