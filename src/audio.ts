import Renderer from "engine/renderer.js";


type Point = [number, number];

const COUNTS: Record<string, number> = {
	"cannon": 8,
	"shot": 1,
	"splash": 2,
	"crash": 2,
	"hit": 2
}
let NAMES: Record<string, string[]> = {};
let BUFFERS: Record<string, AudioBuffer> = {};

const ctx = new AudioContext();
let renderer: Renderer;

export function inPort(point: Point) {
	const lt = renderer.leftTop;
	const rb = renderer.rightBottom;
	return (point[0] >= lt[0] && point[0] <= rb[0] && point[1] >= lt[1] && point[1] <= rb[1]);
}

function createPanner() {
	let panner = ctx.createPanner();
	panner.rolloffFactor = 0.1;
	return panner;
}

function updateListener() {
	let center = renderer.center;
	ctx.listener.setPosition(center[0], 1, center[1]);
}

function nameToPath(name: string) { return `audio/${name}.mp3`; }

export function tada() {
	new Audio(nameToPath("tada")).play();
}

export function sfx(type: string, position: Point) {
	if (!inPort(position)) { return; }

	let source = ctx.createBufferSource();

	let name = NAMES[type].random();
	source.buffer = BUFFERS[name];
	let panner = createPanner();
	source.connect(panner);
	panner.connect(ctx.destination);

	updateListener();
	panner.setPosition(position[0], 0, position[1]);
	source.start();
}

export class Shot {
	source = ctx.createBufferSource();
	panner = createPanner();

	constructor(position: Point) {
		updateListener();

		let name = NAMES["shot"].random();
		this.source.buffer = BUFFERS[name];

		let gain = ctx.createGain();
		gain.gain.value = 0.3;
		this.source.connect(gain);

		gain.connect(this.panner);
		this.panner.connect(ctx.destination);

		this.position(position);
		this.source.start();
	}

	position(position: Point) {
		this.panner.setPosition(position[0], 0, position[1]);
	}

	end(type: string, position: Point) {
		this.source.stop();
		sfx(type, position);
	}
}

export function start() {
	let audio = new Audio(nameToPath("bg"));
	audio.volume = 0.5;
	audio.loop = true;
	audio.play();
}

async function bufferFile(name: string) {
	let response = await fetch(nameToPath(name));
	let audioData = await response.arrayBuffer();
	BUFFERS[name] = await ctx.decodeAudioData(audioData);
}

export async function init(renderer_: Renderer) {
	renderer = renderer_;

	let allNames: string[] = [];
	for (let id in COUNTS) {
		let count = COUNTS[id];
		let names = new Array(count).fill(0).map((_, i) => `${id}${i.toString().padStart(2, "0")}`);
		NAMES[id] = names;
		allNames = allNames.concat(names);
	}

	let promises = allNames.map(bufferFile);
	return Promise.all(promises);
}

init();
