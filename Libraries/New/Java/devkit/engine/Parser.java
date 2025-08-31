package devkit.engine;

import java.util.Map;

import devkit.html.*;

public class Parser {
    private final Page page;
    public Parser(Page page) {
        this.page = page;
    }

    public String parse() {
        String content = "[content]";
        if (page.head.head.isEmpty() && page.body.body.isEmpty()) {
            content += "[body][h1]Error![/h1][p]This page has been detected to be EMPTY![/p][/body][/content]";
        } else {
            if (!page.head.head.isEmpty()) {
                content += "[head]";
                for (Element elem : page.head.head) {
                    String c = "";
                    c += "[" + elem.elemType + " ";
                    final Map<String, String> attributes = elem.getAttributes();
                    if (attributes.size() != 0) for (String key : attributes.keySet()) {
                        c += key + "=\"" + attributes.get(key) + "\" ";
                    }
                    c = c.strip() + "]";
                }
            }
        }
        return content;
    }
}
