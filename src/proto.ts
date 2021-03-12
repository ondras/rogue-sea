interface Array<T> {
	random(): T;
	shuffle(): T[];
	norm(): number;
}

interface Number {
	mod(n: number): number;
}

Array.prototype.random = function r() {
	return this[Math.floor(Math.random()*this.length)];
}

Array.prototype.shuffle = function() {
	let result = [];
	while (this.length) {
		let index = Math.floor(Math.random()*this.length);
		result.push(this.splice(index, 1)[0]);
	}
	return result;
}

Array.prototype.norm = function() {
	return Math.sqrt(this[0]*this[0] + this[1]*this[1]);
}

Number.prototype.mod = function(n: number) {
	return ((this as number) % n + n) % n;
}
