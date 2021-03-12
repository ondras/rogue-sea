type Test = () => void | Promise<void>;

let tests: Test[] = [];
let stats = {
	passed: 0,
	failed: 0,
	assertions: 0
}

export function register(test: Test) { tests.push(test); }

export function assert(x: any, msg: string) {
	stats.assertions++;
	if (x) { return; }
	throw new Error(`Assertion failed: ${msg}`);
}

export function assertEquals(x: any, y: any, msg: string) {
	let cx = (x instanceof Array ? x.join(",") : x);
	let cy = (y instanceof Array ? y.join(",") : y);
	return assert(cx == cy, `${msg} (${cx} should equal ${cy})`);
}

export async function run() {
	let todo = tests.slice();

	stats.passed = 0;
	stats.failed = 0;
	stats.assertions = 0;

	while (todo.length) {
		try {
			let result = (todo.shift() as Test)();
			if (result && result.then) { await result; }
			stats.passed++;
		} catch (e) {
			stats.failed++;
			console.warn(e);
		}
	}

	return stats;
}

export async function runAndLog() {
	let r = await run();
	console.log(r);
}
