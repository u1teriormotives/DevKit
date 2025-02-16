import Element from "./Element";
import Node from "./Node";
import { Num } from "./Numbering";

export type visibilityStateType =
  "visible" |
  "hidden" |
  "prerender" |
  "unloaded";

// todo:
/* make HTMLCollection
 * make charset type
 * more CSS interfaces
 */
export default class Document extends Node {
  public readonly activeElement: Element;
  public adoptedStyleSheets: undefined; // change later
  public body: string;
  public readonly charaterSet: string; // change later
  public readonly childElementCount: Num;
  public readonly children: Element[] = [];
  public readonly combatMode: boolean;
  public readonly contentType: string;
  public readonly script: string;
  public readonly doctype: string;
  public readonly documentElement: Element; // change later
  public readonly documentURI: string;
  public readonly embeds: Set<Element> = new Set<Element>(); // make this later
  public readonly featurePolicy: string; // make interface later
  public readonly firstElementChild: Element;
  public fonts: string; // make interface later
  public readonly forms: Set<Element> = new Set<Element>(); // make this later
  public readonly fragmentDirective: Element; // make this later
  public readonly fullscreenElement: Element;
  public readonly head: Element;
  public readonly hidden: boolean;
  public readonly images: Set<Element> = new Set<Element>(); // make this later
  public readonly implementation: Node;
  // ^ "Returns the DOM implementation associated with the current document"
  // ^^ not sure what that's value should be
  public readonly lastElementChild: Element;
  public readonly links: Set<Element> = new Set<Element>(); // make this later
  public readonly pictureInPictureElement: Element;
  public readonly pictureInPictureEnabled: Element;
  public readonly plugins: Set<Element> = new Set<Element>(); // make this later
  public readonly pointerLockElement: Element;
  public readonly prerendering: boolean;
  public readonly scripts: Set<Element> = new Set<Element>(); // make this later
  public readonly scrollingElement: Element;
  public readonly styleSheets: Set<Element> = new Set<Element>(); // make this later
  public readonly timeline: undefined; // make this later (DocumentTimeline)
  public readonly visibilityState: visibilityStateType;

  // extensions
  public cookie: string;
  public readonly defaultView: undefined; // make this later
  public designMode: boolean;
  public dir: ("rtl" | "ltr");
  public readonly fullscreenEnabled: boolean;
  public readonly lastModified: string; // make this type later
  public readonly location: string; // add in url type
  public readonly readyState: undefined; // make this type later
  public readonly referrer: string; // add in url type
  public title: string; // same as <title>
  public readonly URL: string; // add in url type

  // add in methods later
}
