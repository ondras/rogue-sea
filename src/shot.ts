import { DIRS, sleep } from "engine/utils.js";
import Renderer, { Renderable, RenderWalker } from "engine/renderer.js";

import Sea from "./sea.js";
import Ship from "./ship.js";
import Island from "./island.js";
import * as palette from "./palette.js";
import * as audio from "./audio.js";
import * as rules from "./rules.js";


type Point = [number, number];

export default class Shot implements Renderable {
	protected position: Point | null = null;

	constructor(protected readonly renderer: Renderer, protected readonly sea: Sea) {}

	async fly(position: Point, orientation: number) {
		let target = null;
		this.position = [position[0], position[1]];

		let a;
		if (this.inPort(position)) { a = new audio.Shot(this.position); }

		let d = DIRS[orientation];
		while (true) {
			this.position[0] += d[0];
			this.position[1] += d[1];
			this.renderer.dirty(this);
			a && a.position(this.position);

			if (this.inPort(this.position)) { // invisible shots are fast
				await sleep(rules.SHOT_STEP);
			}

			let t = this.sea.query(this.position);
			if (t) {
				target = t;
				break;
			}

			let dx = this.position[0] - position[0];
			let dy = this.position[1] - position[1];
			let dist = [dx, dy].norm();
			if (dist >= rules.CANNON_RANGE) { break; }
		}

		if (a) {
			let sfx = "";
			if (target) {
				if (target instanceof Ship) { sfx = "hit"; }
				if (target instanceof Island) { sfx = "crash"; }
			} else {
				sfx = "splash";
			}
			a.end(sfx, this.position);
		}

		this.renderer.remove(this);
		return target;
	}

	footprint(cb: RenderWalker) {
		if (!this.position) { return; }
		cb(this.position.slice() as Point, this.renderData);
	}

	query(point: Point) {
		if (!this.position) { return null; }
		if (point[0] != this.position[0] || point[1] != this.position[1]) { return null; }
		return this.renderData;
	}

	get renderData() {
		if (!this.position) { throw new Error("Cannot get render data for a non-positioned shot"); }
		let water = this.sea.bg.query(this.position);
		return {
			fg: palette.YELLOW,
			bg: water.bg,
			ch: "*".charCodeAt(0)
		};
	}

	inPort(point: Point) {
		const { renderer } = this;
		const lt = renderer.leftTop;
		const rb = renderer.rightBottom;
		return (point[0] >= lt[0] && point[0] <= rb[0] && point[1] >= lt[1] && point[1] <= rb[1]);
	}
}
