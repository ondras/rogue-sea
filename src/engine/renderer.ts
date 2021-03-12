import { Scene, SceneOptions, Palette } from "fastiles";


type Point = [number, number];

export interface RenderData {
	fg: number;
	bg: number;
	ch: number;
}

export type RenderWalker = (point: Point, renderData: RenderData) => void;

export interface Renderable {
	footprint: (cb: RenderWalker) => void;
	query: (point: Point) => RenderData | null;
}

interface RenderableRecord {
	item: Renderable;
	footprint: Point[];
}

export default class Renderer {
	private layers: RenderableRecord[][] = [];
	private scene: Scene;
	private offset!: Point;
	private tileCount: Point;

	constructor(options: SceneOptions, palette: Palette) {
		this.tileCount = options.tileCount;
		let scene = new Scene(options, palette);
		document.body.appendChild(scene.node);

		this.scene = scene;
		this.center = [0, 0];
	}

	configure(options: Partial<SceneOptions>) {
		this.scene.configure(options);

		if (options.tileCount) {
			let center = this.center; // remember old center
			this.tileCount = options.tileCount;
			this.center = center; // re-center = re-draw
		}
	}

	get node() { return this.scene.node; }

	set center(center: Point) {
		this.offset = [
			center[0] - (this.tileCount[0]>>1),
			center[1] - (this.tileCount[1]>>1)
		];

		this.drawAll();
	}

	get center() {
		return [
			this.offset[0] + (this.tileCount[0]>>1),
			this.offset[1] + (this.tileCount[1]>>1)
		];
	}

	get leftTop() {
		return [
			this.offset[0],
			this.offset[1]
		];
	}

	get rightBottom() {
		return [
			this.offset[0] + this.tileCount[0],
			this.offset[1] + this.tileCount[1]
		];
	}

	clear() { this.layers = []; }

	add(item: Renderable, layer: number) {
		const record = {item, footprint: []};
		while (this.layers.length <= layer) { this.layers.push([]); }

		this.layers[layer].push(record);
		this.drawRecord(record, {hitTest: true});
	}

	remove(item: Renderable) {
		let record: RenderableRecord | undefined;
		this.layers.forEach(layer => {
			let index = layer.findIndex(record => record.item == item);
			if (index > -1) {
				record = layer[index];
				layer.splice(index, 1);
			}
		});
		if (!record) { throw new Error("Cannot remove item; item not found"); }

		this.drawFootprint(record);
	}

	dirty(item: Renderable) {
		let record: RenderableRecord | undefined;
		this.layers.forEach(layer => {
			let r = layer.find(record => record.item == item);
			if (r) { record = r; }
		});
		if (!record) { throw new Error("Cannot mark dirty; item not found"); }

		this.drawFootprint(record); // old data
		this.drawRecord(record, {hitTest: true}); // new data
	}

	private hitTest(point: Point) {
		let i = this.layers.length;
		while (i --> 0) {
			let layer = this.layers[i];
			let j = layer.length;
			while (j --> 0) {
				let record = layer[j];
				let data = record.item.query(point);
				if (data) { return data; }
			}
		}

		throw new Error("Hit test fail");
	}

	private drawAll() {
		this.layers.forEach(layer => layer.forEach(record => {
			this.drawRecord(record, {hitTest:false});
		}));
	}

	private drawFootprint(record: RenderableRecord) {
		record.footprint.forEach(point => {
			this.drawData(point, this.hitTest(point));
		});
	}

	private drawRecord(record: RenderableRecord, options: {hitTest:boolean}) {
		record.footprint = [];
		record.item.footprint((point, data) => {
			record.footprint.push(point);
			this.drawData(point, options.hitTest ? null : data);
		});
	}

	private drawData(point: Point, data: RenderData | null) {
		// scene = world - offset
		// world = scene + offset
		let scenePoint: Point = [
			point[0] - this.offset[0],
			point[1] - this.offset[1]
		];
		if (scenePoint[0] < 0 || scenePoint[1] < 0 || scenePoint[0] >= this.tileCount[0] || scenePoint[1] >= this.tileCount[1]) { return; }

		if (!data) { data = this.hitTest(point); }
		this.scene.draw(scenePoint, data.ch, data.fg, data.bg);
	}
}
