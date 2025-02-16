import Node from "./Node";
import { Num } from "./Numbering";

export default class Element extends Node {
  // why am i doing this
  // properties
  public readonly assignedSlot: Node; // change to HTMLSlotElement later
  public readonly attributes: Map<string, any>; // maybe make a new Map<> class later?
  public readonly childElementCount: Num;
  public readonly children: Element[] = [];
  public readonly classList: Set<string>; // perhaps make the class it's supposed to be?
  public className: string;
  public readonly clientHeight: Num;
  public readonly clientLeft: Num;
  public readonly clientTop: Num;
  public readonly clientWidth: Num;
  public readonly currentCSSZoom: Num;
  public readonly elementTiming: string; // not sure if to support or not
  public readonly firstElementChild: Element | null;
  public id: string;
  public innerHTML: string;
  public readonly lastElementChild: Element | null;
  public readonly localName: string;
  public readonly namespaceURI: string;
  public readonly nextElementSibling: Element | null;
  public outerHTML: string;
  public part: Set<string>; // perhaps make the class it's supposed to be?
  public readonly prefix: string | null;
  public readonly previousElementSibling: Element | null;
  public readonly scrollHeight: Num;
  public scrollLeft: Num;
  /** @deprecated */
  public readonly scrollLeftMax: Num;
  public scrollTop: Num;
  /** @deprecated */
  public readonly scrollTopMax: Num;
  public readonly scrollWidth: Num;
  public readonly shadowRoot: Element | null; // not sure if i need a ShadowRoot class
  public readonly slot: Node | null; // change later
  public readonly tagName: string;

  // not supporting aria properties because there's too much
  // besides, i belive the properties are in HTMLElement anyway

  // methods are added later because i'm not making those rn
}