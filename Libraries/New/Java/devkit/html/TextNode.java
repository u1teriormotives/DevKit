package devkit.html;

public class TextNode {
    private String content;

    public TextNode(String text) {
        this.content = text;
    }
    public void setText(String text) {
        this.content = text;
    }
    public String getText() {
        return this.content;
    }
}
