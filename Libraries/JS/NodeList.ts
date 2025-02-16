import Node from "./Node";

export default class NodeList {
  private nodes: Node[];
  public length: number;

  constructor(nodes: Node[] = []) {
    this.nodes = [...nodes];
    this.length = nodes.length;
  }

  public item(i: number): Node | null {
    return this.nodes[i] || null;
  }

  public append(node: Node): boolean {
    try {
      this.nodes.push(node);
      this.length = this.nodes.length;
      return true;
    } catch (e) {
      return false;
    }
  }

  public forEach(callback: (node: Node, index: number, array: Node[]) => void): void {
    for (let i = 0; i < this.nodes.length; i++) {
      callback(this.nodes[i], i, this.nodes);
    }
  }

  [Symbol.iterator]() {
    let i = 0;
    return {
      next: () => {
        if (i < this.nodes.length) {
          return { value: this.nodes[i++], done: false };
        }
        return { done: true };
      }
    };
  }
}
