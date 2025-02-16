import Element from "../Element";

type CAP_VALUES = 
  "none" |
  "off" |
  "on" |
  "characters" |
  "words" |
  "sentences";

export default class HTMLElement extends Element {
  public accessKey: string;
  public readonly accessKeyLabel: string;
  public readonly attributeStyleMap: Map<string, any> = new Map<string, any>();
  public autocapitalize: CAP_VALUES;
  public autofocus: boolean;
  public autocorrect: boolean;
  public contentEditable: boolean;
  public readonly dataset: Map<string, string> = new Map<string, string>();
  public dir: string;
  public draggable: boolean;
  public editContent: string | null; // change when implemented
  public enterKeyHint: Function;
  public hidden: boolean | string;
  public inert: boolean;
  public innerText: string;
  public inputMode: string;
  public readonly isContentEditable: boolean = false;
  public lang: string;
  public nonce: string;
  public readonly offsetHeight: number;
  public readonly offsetLeft: number;
  public readonly offsetParent: Element;
  public readonly offsetTop: number;
  public readonly offsetWidth: number;
  public outerText: string;
  public popover: string;
  public spellcheck: boolean;
  public style: string; // need to make CSSStyleDeclaration
  public tabIndex: number;
  public title: string;
  public translate: boolean;
  public virtualKeyboardPolicy: string;
  public writingSuggestions: string;

  // implement methods later
}
