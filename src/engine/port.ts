import Renderer from "./renderer.js";
import { Palette } from "fastiles";
import { DIRS, sleep } from "./utils.js";


type Point = [number, number];

const FONT_SIZES = [6, 8, 10, 12, 14, 16, 18, 20];
const DPR = window.devicePixelRatio;
const FONTS: Record<number, HTMLImageElement | HTMLCanvasElement> = {};

async function loadImage(src: string) {
	let img = new Image();
	img.src = src;
	await img.decode();
	return img;
}

function adjustByDPR(size: number) {
	let adjusted = Math.round(size * DPR);
	if (!(adjusted in FONTS)) {
		const source = FONTS[size];
		let canvas = document.createElement("canvas");
		canvas.width = (source.width / size) * adjusted;
		canvas.height = (source.height / size) * adjusted;

		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
		FONTS[adjusted] = canvas;
	}

	return adjusted;
}

function computeSceneOptions(node: HTMLElement, tileSize: number) {
	let tileCount = computeTileCount(node, tileSize);
	let adjustedTileSize = adjustByDPR(tileSize);

	return {
		tileCount,
		tileSize: [adjustedTileSize, adjustedTileSize] as Point,
		font: FONTS[adjustedTileSize]
	};
}

function computeTileCount(node: HTMLElement, tileSize: number) {
	return [node.offsetWidth, node.offsetHeight].map(size => {
		let tiles = Math.ceil(size/tileSize);
		if (tiles % 2 == 0) { tiles++; } // need odd number
		return tiles;
	}) as Point;
}

export async function init() {
	let promises = FONT_SIZES.map(size => loadImage(`font/${size}.png`));
	let images = await Promise.all(promises);
	images.forEach((image, i) => FONTS[FONT_SIZES[i]] = image);
}

export default class Port {
	readonly renderer: Renderer;

	static bestSize(parent: HTMLElement, tileCountHorizontal: number, palette: Palette) {
		const idealSize = parent.offsetWidth / tileCountHorizontal;
		const bts = FONT_SIZES.slice().sort((a, b) => Math.abs(a-idealSize) - Math.abs(b-idealSize))[0];

		return new this(parent, bts, palette);
	}

	static smallestTiles(parent: HTMLElement, palette: Palette) {
		return new this(parent, FONT_SIZES[0], palette);
	}

	constructor(readonly parent: HTMLElement, protected tileSize: number, palette: Palette) {
		let options = computeSceneOptions(parent, tileSize);
		this.renderer = new Renderer(options, palette);
		parent.appendChild(this.renderer.node);
		this.updateSceneSize(options.tileCount);

		window.addEventListener("resize", _ => this.sync());
	}

	sync() {
		let tileCount = computeTileCount(this.parent, this.tileSize);
		this.renderer.configure({tileCount});
		this.updateSceneSize(tileCount);
	}

	adjustTileSize(diff: 1 | -1) {
		let index = FONT_SIZES.indexOf(this.tileSize) + diff;
		if (index < 0 || index >= FONT_SIZES.length) { return false; }

		this.tileSize = FONT_SIZES[index];
		let options = computeSceneOptions(this.parent, this.tileSize);
		this.renderer.configure(options);
		this.updateSceneSize(options.tileCount);

		return true;
	}

	protected updateSceneSize(tileCount: Point) {
		const node = this.renderer.node;
		const width = tileCount[0] * this.tileSize;
		const height = tileCount[1] * this.tileSize;
		node.style.width = `${width}px`;
		node.style.height = `${height}px`;

		node.style.left = `${(this.parent.offsetWidth-width)/2}px`;
		node.style.top = `${(this.parent.offsetHeight-height)/2}px`;
	}

	async panAndZoomTo(target: Point) {
		const { renderer } = this;

		type Point = [number, number];
		function d(p1: Point, p2: Point) {
			let dx = p1[0]-p2[0];
			let dy = p1[1]-p2[1];
			return [dx, dy].norm();
		}

		const tileCount = computeTileCount(this.parent, this.tileSize);

		while (true) {
			let distance = d(this.renderer.center, target);
			if (distance == 0) { break; }

			let candidates = DIRS.map(dir => {
				let position = [renderer.center[0] + dir[0], renderer.center[1] + dir[1]] as Point;
				let distance = d(position, target);
				return { position, distance };
			});

			candidates.sort((a, b) => a.distance - b.distance);
			this.renderer.center = candidates.shift()!.position;
			this.updateSceneSize(tileCount); // re-center, because sidebar
			await sleep(30);
		}

		while (true) {
			let ok = this.adjustTileSize(1);
			if (!ok) { break; }
			await sleep(50);
		}
	}
}
