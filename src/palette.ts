import { Palette } from "fastiles";


export let palette = Palette.rexpaint8();
export let BLACK = 184;
export let WHITE = 188;
export let BLUE = 99;
export let YELLOW = 37;
export let ORANGE = 29;
export let GRAY = 170;
export let GREEN = 52;

export let BROWN_LIGHT = 179;
export let BROWN_DARK = 177;

//export let BLUES = [96, 97, 98, 99, 100, 101, 102, 103];
export let BLUES: number[] = [];

const count = 20;
for (let i=0;i<count;i++) {
	let index = 100+i;
	let blue = 100 + Math.round(100 * (i/count));
	palette.set(index, `rgb(30, 50, ${blue})`);
	BLUES.push(index);
}
