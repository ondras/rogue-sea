export function wait() {
	return new Promise<KeyboardEvent>(resolve => {
		window.addEventListener("keydown", resolve, {once:true});
	});
}

export async function waitFor(...keys: string[]) {
	while (true) {
		let event = await wait();
		if (keys.includes(event.key)) { return event.key; }
	}
}
