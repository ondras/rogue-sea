import Background from "engine/background.js";

import * as palette from "./palette.js";
import Noise from "./noise.js";


type Point = [number, number];
const SCALE = 1/80;
const noise = new Noise();


function scaleToSet<T>(value: number, set: T[]) {
	return set[Math.round((value+1)/2 * (set.length-1))];
}

export default class Water extends Background {
	query(point: Point) {
		let value = noise.get(point[0]*SCALE, point[1]*SCALE);
//		return {ch: 0, fg: 0, bg: scaleToSet(value, palette.BLUES)};
//		return {ch: 249, bg: scaleToSet(value, palette.BLUES), fg: palette.GRAY};
		return {ch: 32, bg: scaleToSet(value, palette.BLUES), fg: palette.GRAY};
	}
}
