import java.util.ArrayList;

public class Node extends EventTarget {
    public final String baseURI = "";
    public final ArrayList<Node> childNodes = new ArrayList<Node>();
    public final Node firstChild = null;
    public final boolean isConnected = false;
    public final Node lastChild = null;
    public final Node nextSibling = null;
    public final String nodeName = "";
    public final NodeType nodeType;
    public String nodeValue = new String();
    public final Node ownerDocument = null;
    public final Node parentNode = null;
    public final Node parentElement = null;
    public final Node previousSibling = null;
    public String textContent = new String();

    public Node(NodeType nodetype) {
        this.nodeType = nodetype;
    }

    public final void appendChild(Node childNode) {}
    public final Node cloneNode() {
        return this;
    }
    public final void compareDocumentPosition(Node other) {}
    public final boolean contains(Node node) {
        for (Node i : this.childNodes) {
            if (i.equals(node)) return true;
        }
        return false;
    }
    public final Node getRootNode() {
        return this.parentElement;
    }
    public final boolean hasChildNodes() {
        if (this.childNodes.size() > 0) return true;
        else return false;
    }
    public final void insertBefore(Node node) {}
    public final boolean isDefaultNamespace() {
        if (this.baseURI == this.ownerDocument.baseURI) return true;
        else return false;
    }
    public final boolean isEqualNode(Node other) {
        return this.equals(other);
    }
    public final boolean isSameNode(Node other) {
        return this == other;
    }
    public final String lookupNamespace() {
        return this.baseURI;
    }
    public final void normalize() {}
    public final void removeChild(Node child) {}
    public final void replaceChild(Node child, Node newChild) {}
}
