import { Bitmap } from "./bitmap.js";
import Renderer, { Renderable, RenderData, RenderWalker } from "./renderer.js";
import World from "./world.js";


// WORLD = POSITION + SHAPE - ORIGIN
// SHAPE = WORLD - POSITION + ORIGIN

type Point = [number, number];

export type RenderableBitmap = Bitmap<{
	renderData: RenderData;
	type: string;
}>;

export default class Entity implements Renderable {
	protected _position: Point = [0, 0];
	protected _orientation = 1;
	renderer?: Renderer;

	constructor(protected bitmaps: RenderableBitmap[]) {}

	get position() { return this._position; }
	set position(position: Point) {
		this._position = position;
		this.renderer && this.renderer.dirty(this);
	}

	get orientation() { return this._orientation; }
	set orientation(o) {
		this._orientation = o;
		this.renderer && this.renderer.dirty(this);
	}

	query(point: Point, position=this._position, orientation=this._orientation) {
		const bitmap = this.bitmaps[orientation];

		let sx = point[0] - position[0] + bitmap.origin[0];
		let sy = point[1] - position[1] + bitmap.origin[1];

		let row = bitmap.data[sy];
		if (!row) { return null; }

		let item = row[sx];

		return item && item.renderData;
	}

	footprint(cb: RenderWalker, position=this._position, orientation=this._orientation) {
		const bitmap = this.bitmaps[orientation];
		const [px, py] = [
			position[0] - bitmap.origin[0],
			position[1] - bitmap.origin[1]
		];

		bitmap.data.forEach((row, sy) => {
			row.forEach((item, sx) => {
				if (!item) { return; }
				cb([sx + px, sy + py], item.renderData);
			});
		});
	}

	fits(world: World, position: Point, orientation: number) {
		let points: Point[] = [];
		let isInSea = world.has(this);

		this.footprint(point => {
			if (isInSea && this.query(point)) { return; } // inside of the current footprint
			points.push(point);
		}, position, orientation);

		return points.every(point => !world.query(point));
	}
}
