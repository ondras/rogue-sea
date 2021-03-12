import * as point from "./point.js";
import { ensure } from "./utils.js";
import * as test from "./test.js";


export interface Bitmap<T> {
	origin: point.Point;
	data: (T | null)[][];
}

export function clone<T>(s: Bitmap<T>): Bitmap<T> {
	return JSON.parse(JSON.stringify(s));
}

export function rotate<T>(bitmap: Bitmap<T>, amount: number): Bitmap<T> {
	interface Rotated {
		rx: number;
		ry: number;
		t: T | null;
	}

	let offset = [Infinity, Infinity];
	let rotated: Rotated[] = [];

	bitmap.data.forEach((row, y) => {
		row.forEach((t, x) => {
			let [rx, ry] = point.rotate([x, y], bitmap.origin, amount);
			offset[0] = Math.min(offset[0], rx);
			offset[1] = Math.min(offset[1], ry);

			rotated.push({rx, ry, t});
		});
	});

	let data: (T | null)[][] = [];

	rotated.forEach(item => {
		item.rx -= offset[0];
		item.ry -= offset[1];

		ensure(data, item.rx, item.ry);

		data[item.ry][item.rx] = JSON.parse(JSON.stringify(item.t)) as T;
	});

	let origin: point.Point = [
		bitmap.origin[0] - offset[0],
		bitmap.origin[1] - offset[1]
	];

	return {data, origin};
}


test.register(() => {
	function str(s: Bitmap<string>) {
		return s.data.map(r => r.join("")).join("\n");
	}

	let source1 = {
		data: [["x", "o", "o"]],
		origin: [0, 0] as point.Point
	}
	let rotated1 = rotate(source1, 1);

	test.assertEquals(
		str(rotated1),
		"x\no\no",
		"rotate data"
	);

	test.assertEquals(
		rotated1.origin,
		[0, 0],
		"rotate origin"
	);

	let source2 = {
		data: [["x", "o", "o"]],
		origin: [1, 0] as point.Point
	}
	let rotated2 = rotate(source2, 1);

	test.assertEquals(
		str(rotated2),
		"x\no\no",
		"rotate data"
	);

	test.assertEquals(
		rotated2.origin,
		[0, 1],
		"rotate origin"
	);
});
