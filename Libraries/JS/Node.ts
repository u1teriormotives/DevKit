import NodeList from "./NodeList";
import NodeTypes from "./NodeTypes";
import { UNSIGNED_SHORT } from "./Numbering";

export default class Node {
  // base properties
  public readonly baseURI: string;
  public readonly childNodes: NodeList | null = new NodeList([]);
  public readonly firstChild: Node | null;
  public readonly isConnected: boolean;
  public readonly lastChild: Node | null;
  public readonly nextSibling: Node | null; // needs implementation
  public readonly nodeName: string;
  public readonly nodeType: UNSIGNED_SHORT;
  public nodeValue: string;
  public readonly ownerDocument: Node | null; // change after implementing Document
  public readonly parentNode: Node | null; // add possible different nodes here
  public readonly parentElement: Node | null; // change after implementing Element
  public readonly previousSibling: Node | null; // needs implementation
  public textContent: string;

  constructor(
    nodeType: UNSIGNED_SHORT,
    nodeName: string,
    nodeValue: string = "",
  ) {
    this.nodeType = nodeType;
    this.nodeName = nodeName;
    this.nodeValue = nodeValue;
    this.textContent = nodeValue;
  }

  // methods

  /**
   * Adds the specified `childNode` argument as the last child to the current node. If the
   * argument referenced an existing node on the DOM tree, the node will be detached
   * from its current position and attached at the new position.
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild
   * @param node The node to append onto this item
   */
  public appendChild(node: Node): void {
    this.childNodes.append(node);
  }

  /**
   * Clone a Node, and optionally, all of its contents. By default, it clones the content of
   * the node.
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode
   * @param deep Whether or not to clone all the children
   * @returns The clone of the node
   */
  public cloneNode(deep: boolean = true): Node {
    const clone = new Node(this.nodeType, this.nodeName, this.nodeValue);

    // implement later
    // if (this.nodeType === NodeTypes.ELEMENT_NODE && "attributes" in this) {
    //   (clone as any).attributes = { ...this.attributes };
    // }

    const clonedChildren: Node[] = [];
    if (deep && this.childNodes.length > 0) {
      this.childNodes.forEach(child => {
        const childClone = child.cloneNode(true);
        clonedChildren.push(childClone);
      });
    }
    (clone as any).childNodes = new NodeList(clonedChildren);
    if (clonedChildren.length > 0) {
      (clone as any).firstChild = clonedChildren[0];
      (clone as any).lastChild = clonedChildren[clonedChildren.length - 1];
    }

    return clone;
  }

  // i'm just deprecating this
  /**
   * DEPRECATED: only returns 0
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
   * @param node 
   * @deprecated
   * @returns 0
   */
  public compareDocumentPosition(node: Node): number {
    return 0;
  }

  /**
   * Returns `true` or `false` depending on whether the node is a descendant
   * of the calling node
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
   * @param node The node to check for
   * @returns If the node contains said node
   */
  public contains(node: Node): boolean {
    this.childNodes.forEach(n => {
      if (node === n) return true;
    });
    return false;
  }

  /**
   * Returns the context object's root
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/getRootNode
   * @returns The parent node
   */
  public getRootNode(): Node {
    return this.parentNode;
  }

  /**
   * Returns a boolean value indicating whether or not the node has children
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/hasChildNodes
   * @returns If the `childNodes` property's `length` is greater than 0
   */
  public hasChildNodes(): boolean {
    return this.childNodes.length > 0;
  }

  /**
   * Inserts a `node` before the reference node as a child of a specified parent node
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore
   * DO NOT USE: this method has no implementation!
   * @param node The node to insert
   * @todo make the method
   */
  public insertBefore(node: Node): void {}

  /**
   * Accepts a namespace URI as an argument and returns a boolean value with a value
   * of `true` if the namespace is the default namespace on the given node or `false` if
   * not.
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/isDefaultNamespace
   * @param uri The URI to check
   * @returns If it's equal or not
   */
  public isDefaultNamespaceURI(uri: string): boolean {
    return this.baseURI === uri;
  }

  /**
   * Returns a boolean value which indicates whether or not two nodes are of the same
   * type and all their defining data points match.
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/isEqualNode
   * @param node The node to check
   * @returns If they're equal
   */
  public isEqualNode(node: Node): boolean {
    if (
      this.isDefaultNamespaceURI(node.baseURI) &&
      this.nodeName === node.nodeName &&
      this.nodeValue === node.nodeValue &&
      this.textContent === node.textContent &&
      this.nodeType === node.nodeType
    ) return true;
    else return false;
  }

  /**
   * Returns a string containing the prefix for a given namespace URI, if present, and
   * `null` if not. When multiple prefixes are possible, the result is implementation-
   * dependent.
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/lookupPrefix
   * DO NOT USE: this method has no implementation!
   * @param namespace The namespace to check
   * @returns The prefix or null
   * @todo implement
   */
  public lookupPrefix(namespace: string): string | null {
    return null;
  }

  // i'm not implementing any more of these for right now; i'll work on other definitions
}
