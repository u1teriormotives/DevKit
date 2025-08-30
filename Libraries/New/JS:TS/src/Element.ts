import { randomInt } from "node:crypto";
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

export class element implements elementInterface {
  public id: string = "";
  public textContent: string = "";
  public class: string[] = [];
  public style: string[] = [];
  public attributes: Tuple<string, any>[] = [];
  public children: element[] = [];
  public parent: element | null = null;
  public elementType: ElementType;
  private _cachedId?: string;

  constructor(elem: ElementType) {
    this.elementType = elem;
  }

  private generateId() {
    if (this._cachedId) return this._cachedId;
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "1234567890";

    let id = "";
    for (let i = 0; i < 16; i++) {
      const thing = randomInt(1, 3);
      if (thing === 1) id += letters.charAt(randomInt(letters.length));
      else id += numbers.charAt(randomInt(numbers.length));
    }
    return (this._cachedId = id);
  }
  public toString() {
    let children = "";
    if (this.children.length !== 0 || this.children.length > 0) {
      for (const child of this.children) children += child.toString() + "\n\t";
    }
    let attributes = "";
    if (this.attributes.length !== 0 || this.attributes.length > 0) {
      for (const attr of this.attributes) {
        attributes += `[field:${attr[0]}]`;
        attributes += `\t${attr[1]}`;
        attributes += `[/field:${attr[0]}]`;
      }
    }
    let ret = `[${this.elementType} $:${this.generateId()}]
  [field:id]${this.id}[/field:id]
  [field:class]${this.class.join(", ")}[/field:class]
  [field:style]${this.style.join(", ")}[/field:style]`;
    if (children !== "")
      ret += `
  ${children}`;
    if (attributes !== "")
      ret += `
  ${attributes}`;
    ret += `\n  [textContent]${this.textContent}[/textContent]`;
    ret += `\n[/${this.elementType}]`;
    return ret;
  }
}

export default element;
