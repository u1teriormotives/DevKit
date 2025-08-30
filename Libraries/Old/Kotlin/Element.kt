package devkit.web.interfaces

import kotlin.collections.*

open public class Element: Node() {
    private val assignedSlot: Node? = null
    private val attributes: MutableList<Pair<String, Any>> = mutableListOf()
    private var childElementCount: Int = 0
    private val children: MutableList<Element> = mutableListOf()
    private val classList: MutableList<String> = mutableListOf()
    public var className: String = ""
    private var clientHeight: Int = 0
    private var clientLeft: Int = 0
    private var clientTop: Int = 0
    private var clientWidth: Int = 0
    private var currentCSSZoom: Float = 100.0F
    private var firstElementChild: Element? = null
    public var id: String = ""
    public var innerHTML: String = ""
    private var lastElementChild: Element? = null
    private var localName: String = ""
    private var namespaceURI: String = "https://www.w3.org/1999/xhmtl"
    private var nextElementSibling: Element? = null
    public var outerHTML: String = ""
    public var part: MutableList<String> = mutableListOf()
    private var prefix: String = ""
    private var previousElementSibling: Element? = null
    private var scrollHeight: Int = 0
    public var scrollLeft: Int = 0
    public var scrollTop: Int = 0
    private var scrollWidth: Int = 0
    private var shadowRoot: Node? = null
    public var slot: Node? = null
    private var tagName: String = ""

    public fun after(node: Array<Node>): Unit {}
    public fun animate(animations: Array<Any>): Any {}
    public fun append(node: Array<Node>): Unit {}
    public fun attachShadow(shadow: Node): Node {}
    public fun before(node: Array<Node>): Unit {}
    public fun checkVisibility(): Boolean {}
    public fun closest(): Element {}
    public fun computedStyleMap(): Any {}
    public fun getAnimations(): Array<Any> {}
    public fun getAttribute(attr: String): Any {}
    public fun getAttributeNames(): Array<String> {}
    public fun getBoundingClientRect(): Pair<Pair<Int, Int>, Int> {}
    public fun getClientRects(): MutableList<Pair<Int, Int>> {}
    public fun getElementsByClassName(className: String): List<Element> {}
    public fun getElementsByTagName(tagName: String): List<Element> {}
    public fun getHTML(): String {}
    public fun hasAttribute(attr: String): Boolean {}
    public fun hasAttributes(attrs: Array<String>): Boolean {}
    public fun hasPointerCapture(id: String): Boolean {}
    public fun insertAdjacentElement(elem: Element): Unit {}
    public fun insertAdjacentXML(ml: String): Unit {}
    public fun insertAdjacentText(text: Node): Unit {}
    public fun matches(selector: String): Boolean {}
    public fun prepend(nodes: Array<Node>): Unit {}
    public fun querySelector(selector: String): Node {}
    public fun querySelectorAll(selector: String): List<Node> {}
    public fun remove(): Unit {}
    public fun removeAttribute(attr: String): Unit {}
    public fun replaceChildren(children: Array<Node>): Unit {}
    public fun replaceWith(elem: Array<Node> | String): Unit {}
    public fun requestFullscreen(): Unit {}
    public fun requestPointerLock(): Unit {}
    public fun scroll(coords: Pair<Int, Int>): Unit {}
    public fun scrollBy(amnt: Int): Unit {}
    public fun scrollIntoView(): Unit {}
    public fun scrollTo(coords: Pair<Int, Int>): Unit {}
    public fun setAttribute(attr: String, value: Any): Unit {}
    public fun setHTMLUnsafe(html: String): Unit {}
    public fun setPointerCapture(pc: String): Unit {}
    public fun toggleAttribute(attr: String): Unit {}
}