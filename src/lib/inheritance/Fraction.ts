function gcd(a: number, b: number): number {
	a = Math.abs(a);
	b = Math.abs(b);
	while (b) {
		[a, b] = [b, a % b];
	}
	return a;
}

export class Fraction {
	readonly n: number;
	readonly d: number;

	constructor(numerator: number, denominator: number = 1) {
		if (denominator === 0) throw new Error('Denominator cannot be zero');
		const sign = denominator < 0 ? -1 : 1;
		const g = gcd(Math.abs(numerator), Math.abs(denominator)) || 1;
		this.n = (sign * numerator) / g;
		this.d = Math.abs(denominator) / g;
	}

	static readonly ZERO = new Fraction(0);
	static readonly ONE = new Fraction(1);

	add(other: Fraction): Fraction {
		return new Fraction(
			this.n * other.d + other.n * this.d,
			this.d * other.d
		);
	}

	subtract(other: Fraction): Fraction {
		return new Fraction(
			this.n * other.d - other.n * this.d,
			this.d * other.d
		);
	}

	multiply(other: Fraction): Fraction {
		return new Fraction(this.n * other.n, this.d * other.d);
	}

	divide(other: Fraction): Fraction {
		if (other.n === 0) throw new Error('Division by zero');
		return new Fraction(this.n * other.d, this.d * other.n);
	}

	equals(other: Fraction): boolean {
		return this.n === other.n && this.d === other.d;
	}

	greaterThan(other: Fraction): boolean {
		return this.n * other.d > other.n * this.d;
	}

	lessThan(other: Fraction): boolean {
		return this.n * other.d < other.n * this.d;
	}

	isZero(): boolean {
		return this.n === 0;
	}

	isPositive(): boolean {
		return this.n > 0;
	}

	toString(): string {
		if (this.d === 1) return `${this.n}`;
		return `${this.n}/${this.d}`;
	}

	toDecimal(): number {
		return this.n / this.d;
	}

	toJSON(): { numerator: number; denominator: number; display: string; decimal: number } {
		return {
			numerator: this.n,
			denominator: this.d,
			display: this.toString(),
			decimal: Math.round(this.toDecimal() * 10000) / 10000,
		};
	}
}

export function frac(numerator: number, denominator: number = 1): Fraction {
	return new Fraction(numerator, denominator);
}
