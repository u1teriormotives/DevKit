import ElementType from "./ElementType.js";
import Tuple from "./Tuple.js";
export interface elementInterface {
    id: string;
    textContent: string;
    class: string[];
    style: string[];
    attributes: Tuple<string, any>[];
    children: element[];
    parent: element | null;
    elementType: ElementType;
}
export declare class element implements elementInterface {
    id: string;
    textContent: string;
    class: string[];
    style: string[];
    attributes: Tuple<string, any>[];
    children: element[];
    parent: element | null;
    elementType: ElementType;
    private _cachedId?;
    constructor(elem: ElementType);
    private generateId;
    toString(): string;
}
export default element;
//# sourceMappingURL=Element.d.ts.map