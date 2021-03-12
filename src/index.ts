import "./proto.js";
import * as test from "engine/test.js";
import Port, { init as initPort } from "engine/port.js";
import { sleep } from "engine/utils.js";

import * as keyboard from "./keyboard.js";
import { start as startAudio, init as initAudio } from "./audio.js";
import { palette } from "./palette.js";
import Level, { Difficulty } from "./level.js";


async function init() {
	// basic init + show about
	await initPort();
	const main = document.querySelector("main") as HTMLElement;
	let port = Port.smallestTiles(main, palette);
	await initAudio(port.renderer);
	await keyboard.waitFor("Enter");

	// fade out about, start audio
	const about = document.querySelector("#about") as HTMLElement;
	const fadeOut = 3000;
	about.style.setProperty("transition", `opacity ${fadeOut}ms`);
	about.style.opacity = "0";
	sleep(fadeOut).then(() => about.remove());
	startAudio();

	window.addEventListener("keydown", (e: KeyboardEvent) => {
		switch (e.key) {
			case "+": port.adjustTileSize(1); break;
			case "-": port.adjustTileSize(-1); break;
		}
	});

	let gold = 0;
	for (let i=0;i<=3;i++) { // play levels
//		if (i) i=3;
		let level = new Level(i as Difficulty, gold, port);
		let ship = await level.play();

		if (ship.alive) {
			gold += ship.gold;
		} else {
			break;
		}
	}

	location.reload();
}

init();
test.runAndLog();
