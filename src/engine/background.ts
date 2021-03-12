import Renderer, { RenderData, RenderWalker } from "./renderer.js";


type Point = [number, number];

export default abstract class Background {
	constructor(private renderer: Renderer) {}

	abstract query(_point: Point): RenderData;

	footprint(cb: RenderWalker) {
		const lt = this.renderer.leftTop;
		const rb = this.renderer.rightBottom;

		for (let x=lt[0]; x<rb[0]; x++) {
			for (let y=lt[1]; y<rb[1]; y++) {
				let point: Point = [x, y];
				cb(point, this.query(point));
			}
		}
	}
}
