package devkit.html;

import java.util.*;

public class Element {
    private String textContent = null;
    private ArrayList<Element> children = null;
    private Map<String, String> attributes = null;

    public final String elemType = "";

    public Element() {
        this.appendChild(new TextNode(""));
    }
    public Element(TextNode text) {
        this.appendChild(text);
    }
    public Element(TextNode[] text) {
        this.append(text);
    }

    public void append(Element[] elem) {
        for (Element element : elem) this.children.add(element);
    }
    public void appendChild(Element elem) {
        this.children.add(elem);
    }
    public void append(TextNode[] text) {
        String t = "";
        for (TextNode te : text) {
            t += te + "\n";
        }
        this.textContent = t;
    }
    public void appendChild(TextNode text) {
        this.textContent = text.getText();
    }
    public String textContent() {
        return this.textContent;
    }
    public Map<String, String> getAttributes() {
        return this.attributes;
    }
    public void setAttribute(String name, String value) {
        this.attributes.put(name, value);
    }
}
