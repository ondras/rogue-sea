import Entity, { RenderableBitmap } from "engine/entity.js";
import Background from "engine/background.js";
import { RenderData } from "engine/renderer.js";

import * as palette from "./palette.js";


type Point = [number, number];
type Cell = null | {
	renderData: RenderData;
	type: string;
}

type Type = "coconut" | "cannonballs" | "repair";


export default class Island extends Entity {
	readonly name: string;
	type: Type;

	constructor(type: Type = "coconut") {
		let bitmap = randomShape();
		let name = randomName()
		insertName(bitmap, name);

		super([bitmap]);
		this._orientation = 0;
		this.name = name;
		this.type = type;
	}

	blocks(point: Point) {
		const bitmap = this.bitmaps[0];

		let sx = point[0] - this._position[0] + bitmap.origin[0];
		let sy = point[1] - this._position[1] + bitmap.origin[1];

		let row = bitmap.data[sy];
		if (!row) { return false; }

		let item = row[sx];
		if (!item) { return false; }

		return (item.type == "#");
	}

	updateBackground(bg: Background) {
		const bitmap = this.bitmaps[0];

		const [px, py] = [
			this.position[0] - bitmap.origin[0],
			this.position[1] - bitmap.origin[1]
		];

		bitmap.data.forEach((row, j) => row.forEach((data, i) => {
			if (!data) { return; }
			if (data.type != "name") { return; }
			data.renderData.bg = bg.query([i+px, j+py]).bg;
		}));
	}
}

function insertName(bitmap: RenderableBitmap, name: string) {
	let dist = 2;
	let h = bitmap.data.length;
	let w = bitmap.data[0].length;

	while (w < name.length) { // enlarge width
		for (let j=0;j<h;j++) {
			if (w % 2) {
				bitmap.data[j].push(null);
			} else {
				bitmap.data[j].unshift(null);
			}
		}
		if (w % 2 == 0) { bitmap.origin[0]++; }
		w++;
	}

	while (dist --> 0) { // enlarge height
		let row: Cell[] = [];
		for (let i=0;i<w;i++) { row.push(null); }
		bitmap.data.unshift(row);
		bitmap.origin[1]++;
		h++;
	}

	name.split("").forEach((ch, i) => { // render name
		bitmap.data[0][i] = {
			type: "name",
			renderData: {
				ch: ch.charCodeAt(0),
				fg: palette.WHITE,
				bg: 0
			}
		}
	});
}

const subject = ["Island", "Isle", "Beach", "Beaches", "Shore", "Shores", "Chest", "Tears", "Shadow", "Rock", "Rocks", "Cliff", "Cliffs", "Hideout", "Bay", "Cove", "Grave", "Graves", "Lagoon", "Atol", "Lutefisk"];
const person = ["Captain", "Sailor", "Pirate", "Dead man", "Corsair", "Bandit", "Monkey", "Kraken"];
const adjective = ["Cursed", "Lonely", "Lucky", "Sunken", "Distant", "Last", "Ancient", "Hidden", "Forbidden", "Forsaken", "Old", "Sandy"];
const ofwhat = ["Gold", "Hope", "Despair", "Sand", "Salt", "Destiny", "Wind", "Treasures", "Rum", "Fortune", "Death"];

const COLORS = [palette.ORANGE, palette.BROWN_DARK, palette.YELLOW, palette.GRAY, palette.GREEN];

function randomize(strings: TemplateStringsArray, ...values: unknown[][]) {
	return strings.flatMap((str, i) => {
		return (i ? [values[i-1].random(), str] : str);
	}).join("");
}

function randomName() {
	return [
		randomize`${person}'s ${subject}`,
		randomize`${adjective} ${subject}`,
		randomize`${subject} of ${ofwhat}`
	].random();
}

function randomShape() {
	const RX = 2+Math.floor(Math.random()*3);
	const RY = 2+Math.floor(Math.random()*3);
	const color = COLORS.random();

	let origin: Point = [RX, RY];
	let data: Cell[][] = [];
	for (let y=-RY; y<=RY; y++) {
		let row: Cell[] = [];
		data.push(row);
		for (let x=-RX; x<=RX; x++) {
			let dist = Math.sqrt((x/RX)*(x/RX) + (y/RY)*(y/RY));
			let hasCell = true;
			if (dist > 1) {
				hasCell = false;
			} else if (Math.random() + 0.5 < dist) {
				hasCell = false;
			}

			if (hasCell) {
				let renderData = {
					fg: color,
					bg: palette.BROWN_LIGHT,
					ch: "#".charCodeAt(0)
				}
				row.push({ renderData, type: "#"});
			} else {
				row.push(null);
			}
		}
	}

	return { origin, data }
}
