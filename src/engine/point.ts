import * as test from "./test.js";


export type Point = [number, number];

export function rotate(point: Point, origin: Point, amount: number) {
	let delta = [point[0]-origin[0], point[1]-origin[1]];

	let sign = Math.sign(amount);
	while (amount) {
		delta.reverse();
		if (sign == 1) { delta[0] *= -1; }
		if (sign == -1) { delta[1] *= -1; }
		amount -= sign;
	}

	return [delta[0]+origin[0], delta[1]+origin[1]];
}

test.register(() => {
	test.assertEquals(rotate([2, -1], [0, 0], 1), [1, 2], "rotatePoint cw");
	test.assertEquals(rotate([2, -1], [0, 0], -1), [-1, -2], "rotatePoint ccw");

	test.assertEquals(rotate([2, -1], [0, 0], 2), [-2, 1], "rotatePoint multiple cw");
	test.assertEquals(rotate([2, -1], [0, 0], -2), [-2, 1], "rotatePoint multiple ccw");

	test.assertEquals(rotate([0, 0], [2, 2], 1), [4, 0], "rotatePoint nonzero cw");
	test.assertEquals(rotate([1, 2], [2, 2], 1), [2, 1], "rotatePoint cw");
});
