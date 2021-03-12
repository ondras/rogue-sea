import * as test from "./test.js";


export const DIRS = [
	[-1, -1],
	[ 0, -1],
	[ 1, -1],
	[ 1,  0],
	[ 1,  1],
	[ 0,  1],
	[-1,  1],
	[-1,  0]
];

type CharArray = string[][];

const CHAR_PAIRS = `-|\\/`;

export function ensure<T>(arr: (T | null)[][], x: number, y: number) {
	while (arr.length <= y) { arr.push([]); }
	let row = arr[y];
	while (row.length <= x) { row.push(null); }
}

export function stringToCharArray(s: string): CharArray {
	let ca: string[][] = [];

	while (s.startsWith("\n")) { s = s.substring(1); }
	while (s.endsWith("\n")) { s = s.substring(0, s.length-1); }

	s.split("\n").forEach((row, y) => {
		row.split("").forEach((ch, x) => {
			ensure(ca, x, y);
			ca[y][x] = ch;
		});
	});

	return ca;
}

export function switchChar(ch: string) {
	let index = CHAR_PAIRS.indexOf(ch);
	if (index == -1) { return ch; }

	let mod = index % 2;
	let base = Math.floor(index / 2) * 2;
	index = base + ((mod+1)%2);
	return CHAR_PAIRS.charAt(index);
}

export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function angleToOrientation(angle: number) {
	const PI = Math.PI;
	angle += PI; // 0..2pi
	angle -= PI/8; // zero=22.5°
	angle = (angle + 2*PI)%(2*PI);

	return Math.floor((8*angle)/(2*PI));
}

test.register(() => {
	test.assertEquals(switchChar("a"), "a", "switch extra char");
	test.assertEquals(switchChar("-"), "|", "switch 0 char");
	test.assertEquals(switchChar("|"), "-", "switch 1 char");
	test.assertEquals(switchChar("/"), "\\", "switch 2 char");
});
