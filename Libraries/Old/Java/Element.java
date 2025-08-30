import java.util.*;

public class Element extends Node {
    public final Element assignedElement = null;
    public final Map<String, String> attributes = new HashMap<String, String>();
    public final int childElementCount = 0;
    public final ArrayList<Element> children = new ArrayList<>();
    public final ArrayList<String> classList = new ArrayList<>();
    public final String className = new String();
    public final int clientHeight = 0;
    public final int clientLeft = 0;
    public final int clientTop = 0;
    public final int clientWidth = 0;
    public final int currentCSSZoom = 0;
    public final Element firstElementChild = null;
    public String id = new String();
    public String innerHTML = new String();
    public final Element lastElementChild = null;
    public final String namespaceURI = null;
    public final Element nextElementSibling = null;
    public String outerHTML = new String();
    public ArrayList<?> part = new ArrayList<>();
    public final String prefix = new String();
    public final Element previousElementSibling = null;
    public final int scrollHeight = 0;
    public int scrollLeft = 0;
    public int scrollTop = 0;
    public final int scrollWidth = 0;
    public final Node shadowRoot = null;
    public String slot = new String();
    public final String tagName = new String();

    public Element(NodeType nodetype) {
        super(nodetype);
    }

    public void after(ArrayList<Node> elements) {}
    public void animate(ArrayList<?> animations) {}
    public void append(ArrayList<Node> elements) {}
    public Node attachShadow(Node shadow) {
        return this.shadowRoot;
    }
    public void before(ArrayList<Node> elements) {}
    public boolean checkVisibility() {
        final bool ret = new bool(false);
        this.attributes.forEach((String attr, String val) -> {
            if (attr.equals("hidden") && val.equals("true")) ret.setValue(true);
        });
        return ret.getValue();
    }
    public Element closest() {
        return this;
    }
    public String computedStyleMap() {
        return new String();
    }
    public ArrayList<?> getAnimations() {
        return new ArrayList<>();
    }
    public String getAttribute(String attr) {
        final str value = new str(null);
        this.attributes.forEach((String at, String v) -> {
            if (at.equals(attr)) value.setValue(v);
        });
        return value.getValue();
    }
    public ArrayList<String> getAttributeNames() {
        ArrayList<String> attrs = new ArrayList<String>();
        this.attributes.forEach((String attr, String _) -> attrs.add(attr));
        return attrs;
    }
    public tuple<Integer, Integer> getClientRects() {
        return new tuple<Integer, Integer>(0, 0);
    }
    public ArrayList<Element> getElementsByClassName(String className) {
        final ArrayList<Element> i = new ArrayList<Element>();

        this.children.forEach((Element elem) -> {
            if (elem.className.equals(className)) i.add(elem);
        });

        return i;
    }
    public ArrayList<Element> getElementsByTagName(String tagName) {
        final ArrayList<Element> i = new ArrayList<Element>();

        this.children.forEach((Element elem) -> {
            if (elem.tagName.equals((tagName))) i.add(elem);
        });

        return i;
    }
    public String getHTML() {
        return this.innerHTML;
    }
    public boolean hasAttribute(String attr) {
        final bool has = new bool(false);

        this.attributes.forEach((String a, String _) -> {
            if (a.equals(attr)) has.setValue(true);
        });

        return has.getValue();
    }
    public boolean hasAttributes(ArrayList<String> attrs) {
        final bool has = new bool(false);

        attrs.forEach((String a) -> {
            if (!has.getValue()) {
                this.attributes.forEach((String attr, String _) -> {
                    if (attr.equals(a)) has.setValue(true);
                });
            }
        });

        return has.getValue();
    }
    public boolean hasPointerCapture() {
        return false;
    }
    public void insertAdjacentElement(Element elem) {}
    public void insertAdjacentHTML(String html) {}
    public void insertAdjecentText(String text) {}
    public boolean matches(String selector) {
        return true;
    }
    public void prepend(ArrayList<Node> node) {}
    public Node querySelector(String query) {
        Node elem = null;
        for (Element i : this.children) {
            if (i.matches(query)) elem = i;
        }

        return elem;
    }
    public ArrayList<Node> querySelectorAll(String query) {
        ArrayList<Node> elems = new ArrayList<Node>();

        for (Element i : this.children) {
            if (i.matches(query)) elems.add(i);
        }

        return elems;
    }
    public void releasePointerCapture(String pointerCapture) {}
    public void remove() {}
    public void removeAttribute(String attr) {}
    public void replaceChildren(ArrayList<Node> newC) {}
    public void replaceChildren(Node newC) {}
    public void replaceWith(ArrayList<Node> newElems) {}
    public void replaceWith(Node newElemsn) {}
    public void requestFullscreen() {}
    public void requestPointerLock() {}
    public void scroll(tuple<Integer, Integer> coords) {}
    public void scrollIntoView() {}
    public void scrollTo(tuple<Integer, Integer> coords) {}
    public void setAttribute(String attr, String val) {}
    public void setHTMLUnsafe(String html) {}
    public void setPointerCapture(String pc) {}
    public void toggleAttribute(String attr) {}
}