export default class Tuple {
    values;
    constructor(...values) {
        this.values = values.slice(0, 2);
        values.forEach((val, i) => Object.defineProperty(this, i, {
            value: val,
            writable: false,
            enumerable: true,
            configurable: false,
        }));
        Object.freeze(this);
    }
    *[Symbol.iterator]() {
        yield* this.values;
    }
    get size() {
        return this.values.length;
    }
    equals(other) {
        if (this.size !== other.size)
            return false;
        for (let i = 0; i < this.size; i++) {
            if (this[i] !== other[i])
                return false;
        }
        return true;
    }
    toString() {
        const items = [];
        for (const i of this)
            items.push(i);
        return `(${items.join(", ")})`;
    }
}
//# sourceMappingURL=Tuple.js.map