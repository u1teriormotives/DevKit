#include <fstream>
#include <iostream>
#include <map>
#include <memory>
#include <regex>
#include <sstream>
#include <string>
#include <vector>

struct Node {
    std::string tag;
    std::string ref_id;
    std::map<std::string, std::string> attrs;
    std::vector<std::shared_ptr<Node>> children;
    std::string content;
    std::string text;
    std::string normalized_tag;

    Node(std::string tag_,
         std::string ref_id_ = "",
         std::map<std::string, std::string> attrs_ = {},
         std::string content_ = "",
         std::string text_ = "",
         std::string normalized_tag_ = "")
        : tag(std::move(tag_)), ref_id(std::move(ref_id_)),
          attrs(std::move(attrs_)), content(std::move(content_)),
          text(std::move(text_)), normalized_tag(std::move(normalized_tag_)) {}

    std::string pretty(int indent = 0) const {
        std::string pad(indent * 2, ' ');
        std::ostringstream out;
        out << pad << tag;
        if (!ref_id.empty()) out << " id=" << ref_id;
        if (!attrs.empty()) {
            out << " attrs={";
            bool first = true;
            for (auto &kv : attrs) {
                if (!first) out << ", ";
                out << kv.first << ": '" << kv.second << "'";
                first = false;
            }
            out << "}";
        }
        if (!text.empty()) {
            out << "\n" << pad << "  text:\n" << pad << "    " << text;
        }
        if (!content.empty()) {
            out << "\n" << pad << "  content:\n";
            std::istringstream iss(content);
            std::string line;
            while (std::getline(iss, line)) {
                out << pad << "    " << line << "\n";
            }
        }
        for (auto &child : children) {
            out << "\n" << child->pretty(indent + 1);
        }
        return out.str();
    }
};

std::string normalize_tag(const std::string &tag) {
    auto pos = tag.find("::");
    if (pos != std::string::npos) {
        return tag.substr(pos + 2);
    }
    return tag;
}

class DKParser {
public:
    explicit DKParser(const std::string &text) : text(text) {}

    std::vector<std::shared_ptr<Node>> parse() {
        return parse_block(text);
    }

private:
    std::string text;

    const std::regex TAG_OPEN{R"(\[([a-z0-9:\-]+)(?:\s*\$:([A-Za-z0-9]+))?\])", std::regex::icase};
    const std::regex TAG_CLOSE{R"(\[\/([a-z0-9:\-]+)(?:\s*\$:([A-Za-z0-9]+))?\])", std::regex::icase};
    const std::regex TAG_SELFCLOSE{R"(\[([a-z0-9:\-]+)(?:\s*\$:([A-Za-z0-9]+))?\s*\/\])", std::regex::icase};
    const std::regex ATTR{R"(\(([a-z0-9\-_]+)\s*=\s*\"([^"]*)\"\s*\/?\))", std::regex::icase};
    const std::regex DOCUMENT{R"(\{([a-z0-9:\-]+)([\s\S]*?)\/\})", std::regex::icase};
    const std::regex INLINE{R"(\[\[([a-z0-9:\-]+)\]\s*->\s*\{([\s\S]*?)\}\s*\/\])", std::regex::icase};
    const std::regex CONTENT_BLOCK{R"(===BEGIN-TEXT-CONTENT===([\s\S]*?)===END-TEXT-CONTENT===)"};

    std::vector<std::shared_ptr<Node>> parse_block(const std::string &block) {
        std::vector<std::shared_ptr<Node>> nodes;
        std::vector<std::shared_ptr<Node>> stack;

        size_t pos = 0;
        while (pos < block.size()) {
            std::smatch m;

            if (std::regex_search(block.begin() + pos, block.end(), m, ATTR) && m.position() == 0) {
                if (!stack.empty()) {
                    stack.back()->attrs[m[1].str()] = m[2].str();
                }
                pos += m.length();
                continue;
            }

            if (std::regex_search(block.begin() + pos, block.end(), m, DOCUMENT) && m.position() == 0) {
                auto attrs = collect_attrs(m[2].str());
                auto node = std::make_shared<Node>(m[1].str(), "", attrs, "", "", normalize_tag(m[1].str()));
                if (!stack.empty())
                    stack.back()->children.push_back(node);
                else
                    nodes.push_back(node);
                pos += m.length();
                continue;
            }

            if (std::regex_search(block.begin() + pos, block.end(), m, INLINE) && m.position() == 0) {
                auto node = std::make_shared<Node>(
                    m[1].str(),
                    m[2].matched ? m[2].str() : "",
                    std::map<std::string, std::string>{},
                    "",
                    "",
                    normalize_tag(m[1].str())
                );
                if (!stack.empty())
                    stack.back()->children.push_back(node);
                else
                    nodes.push_back(node);
                pos += m.length();
                continue;
            }

            if (std::regex_search(block.begin() + pos, block.end(), m, CONTENT_BLOCK) && m.position() == 0) {
                if (!stack.empty()) {
                    stack.back()->content += m[1].str();
                } else {
                    nodes.push_back(std::make_shared<Node>("content-block", "", std::map<std::string, std::string>{}, m[1].str()));
                }
                pos += m.length();
                continue;
            }

            if (std::regex_search(block.begin() + pos, block.end(), m, TAG_SELFCLOSE) && m.position() == 0) {
                auto node = std::make_shared<Node>(m[1].str(), m[2].str(), std::map<std::string, std::string>{}, "", "", normalize_tag(m[1].str()));
                if (!stack.empty())
                    stack.back()->children.push_back(node);
                else
                    nodes.push_back(node);
                pos += m.length();
                continue;
            }

            if (std::regex_search(block.begin() + pos, block.end(), m, TAG_OPEN) && m.position() == 0) {
                auto node = std::make_shared<Node>(m[1].str(), m[2].str(), std::map<std::string, std::string>{}, "", "", normalize_tag(m[1].str()));
                if (!stack.empty())
                    stack.back()->children.push_back(node);
                else
                    nodes.push_back(node);
                stack.push_back(node);
                pos += m.length();
                continue;
            }

            if (std::regex_search(block.begin() + pos, block.end(), m, TAG_CLOSE) && m.position() == 0) {
                std::string norm = normalize_tag(m[1].str());
                if (stack.empty() || stack.back()->normalized_tag != norm) {
                    throw std::runtime_error("Mismatched closing tag: " + m[1].str());
                }
                stack.pop_back();
                pos += m.length();
                continue;
            }

            size_t next = block.find_first_of("([{=]", pos);
            if (next == std::string::npos) next = block.size();
            std::string raw = block.substr(pos, next - pos);
            if (!raw.empty() && !stack.empty()) {
                if (!stack.back()->text.empty())
                    stack.back()->text += "\n";
                stack.back()->text += trim(raw);
            }
            pos = next;
        }

        return nodes;
    }

    std::map<std::string, std::string> collect_attrs(const std::string &s) {
        std::map<std::string, std::string> attrs;
        std::smatch m;
        std::string tmp = s;
        while (std::regex_search(tmp, m, ATTR)) {
            attrs[m[1].str()] = m[2].str();
            tmp = m.suffix();
        }
        return attrs;
    }

    static std::string trim(const std::string &s) {
        size_t start = s.find_first_not_of(" \t\n\r");
        if (start == std::string::npos) return "";
        size_t end = s.find_last_not_of(" \t\n\r");
        return s.substr(start, end - start + 1);
    }
};
