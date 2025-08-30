export default class Tuple<T, U> {
    readonly [index: number]: T | U;
    private readonly values;
    constructor(...values: T[]);
    [Symbol.iterator](): Generator<T | U, void, unknown>;
    get size(): number;
    equals(other: Tuple<T, U>): boolean;
    toString(): string;
}
//# sourceMappingURL=Tuple.d.ts.map