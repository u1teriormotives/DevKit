export default class Tuple<T, U> {
  readonly [index: number]: T | U;
  private readonly values: (T | U)[];

  constructor(...values: T[]) {
    this.values = values.slice(0, 2);
    values.forEach((val, i) =>
      Object.defineProperty(this, i, {
        value: val,
        writable: false,
        enumerable: true,
        configurable: false,
      })
    );
    Object.freeze(this);
  }

  *[Symbol.iterator]() {
    yield* this.values;
  }

  get size(): number {
    return this.values.length;
  }

  public equals(other: Tuple<T, U>): boolean {
    if (this.size !== other.size) return false;
    for (let i = 0; i < this.size; i++) {
      if (this[i] !== other[i]) return false;
    }
    return true;
  }
  public toString(): string {
    const items: (T | U)[] = [];
    for (const i of this) items.push(i);
    return `(${items.join(", ")})`;
  }
}
