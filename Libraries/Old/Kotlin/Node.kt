package devkit.web.interfaces

import kotlin.collections.*

open public class Node: EventTarget() {
    private var baseURI: String = ""
    private val childNodes: MutableList<Node> = mutableListOf()
    private var firstChild: Node? = null
    private var isConnected: Boolean = null
    private var lastChild: Node? = null
    private var nextSibling: Node? = null
    private var nodeName: String = ""
    private var nodeType: Int = NodeTypes.UNKNOWN_NODE
    public var nodeValue: String = ""
    private var parentNode: Node? = null
    private var parentElement: Element? = null
    private var previousSibling: Node? = null
    private var textContent: String = ""

    public fun appendChild(childNode: Node): Unit {}
    public fun cloneNode(): Node {}
    public fun compareDocumentPosition(other: Node): Int {}
    public fun contains(node: Node): Boolean {}
    public fun getRootNode(): Node {}
    public fun hasChildNodes(nodes: Array<Node>): Boolean {}
    public fun insertBefore(node: Node): Unit {}
    public fun isDefaultNamespace(namespaceURI: String): Boolean {}
    public fun isEqualNode(node: Node): Boolean {}
    public fun isSameNode(node: Node): Boolean {}
    public fun lookupPrefix(prefix: String): Unit {}
    public fun lookupNamespaceURI(uri: String): Unit {}
    public fun normalize(): Unit {}
    public fun removeChild(child: Node): Unit {}
    public fun replaceChild(old: Node, new: Node): Unit {}
}