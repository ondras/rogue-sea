const node = document.querySelector("#log") as HTMLElement;

interface Line {
	text: string;
	count: number;
	id?: string;
}

let paragraph: HTMLElement;
let lines: Line[] = [];


export function text(text: string, id?: string) {
	if (id && lines.length > 0 && lines[lines.length-1].id == id) {
		lines[lines.length-1].count++;
	} else {
		lines.push({text, count:1, id})
	}

	paragraph.innerHTML = lines.map(line => {
		if (line.count > 1) {
			return `${line.text} (x${line.count})`;
		} else {
			return line.text;
		}
	}).join(" ");

	node.scrollTop = node.scrollHeight;
}

export function newline() {
	paragraph = document.createElement("p");
	node.appendChild(paragraph);
	lines = [];
}

export function swear(str: string, id?: string) {
	let prefix = [
		"Arr,",
		"Arr!",
		"Arghh!",
		"Scurvy!",
		"Aye cap'n,",
		"Avast ye,",
		"Yo ho,",
		"Shiver me timbers!",
		"Matey,"
	].random();

	if (prefix.endsWith(",")) { str = `${str.charAt(0).toLowerCase()}${str.substring(1)}`; }

	return text(`${prefix} ${str}`, id);
}


function init() {
	newline();
}

init();