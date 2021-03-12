import { sleep } from "./utils.js";
import World from "./world.js";


export interface Actor<T extends World> {
	act(world: T): number | Promise<number>;
}

interface Record<T extends World> {
	actor: Actor<T>;
	remaining: number;
}

export default class TimeLoop<T extends World> {
	protected queue: Record<T>[] = [];
	protected stopped = false;
	timeScale = 1;

	private next() {
		let first = this.queue.shift() as Record<T>;
		this.queue.forEach(record => record.remaining -= first.remaining);
		return first.actor;
	}

	add(actor: Actor<T>, remaining=0) {
		let record = { actor, remaining };
		let index = 0;
		while (index < this.queue.length && this.queue[index].remaining <= remaining) {
		  index++;
		}
		this.queue.splice(index, 0, record);
	  }

	remove(actor: Actor<T>) {
		let index = this.queue.findIndex(record => record.actor == actor);
		if (index == -1) { throw new Error("Cannot find actor to be removed"); }
		this.queue.splice(index, 1);
	}

	async start(world: T) {
		this.stopped = false;

		while (1) {
			if (this.stopped) { break; }
			let actor = this.next();
			let duration = await actor.act(world);
			this.add(actor, duration);

			if (this.timeScale > 0) { await sleep(duration * this.timeScale); }
		}
	}

	stop() {
		this.stopped = true;
	}
}
