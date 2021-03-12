import { ensure, stringToCharArray, switchChar } from "engine/utils.js";
import { Bitmap } from "engine/bitmap.js";
import * as bitmap from "engine/bitmap.js";
import { RenderableBitmap } from "engine/entity.js";

import {
	RawData,
	SIZE_0_ORIENTATION_0, SIZE_0_ORIENTATION_1,
	SIZE_1_ORIENTATION_0, SIZE_1_ORIENTATION_1,
	SIZE_2_ORIENTATION_0, SIZE_2_ORIENTATION_1
} from "./ship-data.js";
import Ship, { PlayerShip } from "./ship.js";
import * as palette from "./palette.js";


interface TemplateData {
	ch: string;
	type: string;
}
type Template = Bitmap<TemplateData>;

const TEMPLATES: Template[][] = [
	[SIZE_0_ORIENTATION_0, SIZE_0_ORIENTATION_1].map(parseTemplate),
	[SIZE_1_ORIENTATION_0, SIZE_1_ORIENTATION_1].map(parseTemplate),
	[SIZE_2_ORIENTATION_0, SIZE_2_ORIENTATION_1].map(parseTemplate)
];

const CHARS: Record<string, number> = {
	"o": 9,
	" ": 0,
	".": 249
}

function expandData(data: TemplateData) {
	let rd = {
		ch: (data.ch in CHARS ? CHARS[data.ch] : data.ch.charCodeAt(0)),
		fg: 0,
		bg: palette.BROWN_LIGHT
	}

	switch (data.type) {
		case "w": rd.fg = palette.BROWN_DARK; break; // wood
		case "s": rd.fg = palette.WHITE; break; // sail
		case "$": rd.fg = palette.YELLOW; break; // treasure
		default: rd.fg = palette.BLACK; break; // cannon
	}

	return rd;
}

function expandTemplate(template: Template): RenderableBitmap {
	return {
		origin: template.origin,
		data: template.data.map(row => row.map(item => {
			if (!item) { return item; }
			return {
				type: item.type,
				renderData: expandData(item)
			}
		}))
	}
}

function generateTemplates(defaultTemplates: Template[]) {
	let result: Template[] = [];

	for (let i=0;i<8;i++) {
		if (i<defaultTemplates.length) {
			result.push(bitmap.clone(defaultTemplates[i]));
		} else {
			let defaultIndex = (i % 2);
			let defaultBitmap = (defaultTemplates[defaultIndex]);
			let amount = (i-defaultIndex)/2;
			let rotated = bitmap.rotate(defaultBitmap, amount);
			if (amount % 2) { rotated = switchChars(rotated); }
			result.push(rotated);
		}
	}
	return result;
}

function switchChars(template: Template) {
	template.data.forEach(row => row.forEach(data => {
		if (!data) { return; }
		data.ch = switchChar(data.ch);
	}));
	return template;
}

function parseTemplate(rawData: RawData): Template {
	let ca = {
		chars: stringToCharArray(rawData.chars),
		type: stringToCharArray(rawData.type)
	}

	let data: (TemplateData | null)[][] = [];

	ca.chars.forEach((row, y) => {
		row.forEach((_ch, x) => {
			ensure(data, x, y);
			let ch = ca.chars[y][x];
			let type = ca.type[y][x];
			if (type == " ") {
				data[y][x] = null;
			} else {
				data[y][x] = { ch, type };
			}
		});
	});

	return { data, origin: rawData.origin };
}

interface Options {
	size: number;
	pc: boolean;
}
export function create(options: Options) {
	if (!(options.size in TEMPLATES)) { throw new Error(`The Shipyard has no ships of size ${options.size}`); }

	let templates = TEMPLATES[options.size];
	let bitmaps = generateTemplates(templates).map(expandTemplate);

	if (options.pc) {
		let oldCh = "$".charCodeAt(0);
		let newCh = "@".charCodeAt(0);
		bitmaps.forEach(bitmap => {
			bitmap.data.forEach(row => {
				row.forEach(data => {
					if (!data) { return; }
					if (data.renderData.ch == oldCh) { data.renderData.ch = newCh; }
				});
			});
		});
	}
	return new (options.pc ? PlayerShip : Ship)(bitmaps);
}
