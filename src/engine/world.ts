import Entity from "./entity.js";
import Background from "./background.js";
import Renderer from "./renderer.js";


type Point = [number, number];

export default abstract class World {
	constructor(protected readonly renderer: Renderer, readonly bg: Background) {
		renderer.add(bg, 0);
	}
	abstract query(point: Point): Entity | null;
	abstract has(entity: Entity): boolean;
	abstract add(entity: Entity): void;
	abstract remove(entity: Entity): void;
}
