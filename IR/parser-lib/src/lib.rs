use std::fmt;
use std::fs;
use std::path::Path;

const TXT_BEG: &str = "===BEGIN-TEXT-CONTENT===";
const TXT_END: &str = "===END-TEXT-CONTENT===";

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Doc {
    pub items: Vec<Item>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Item {
    Tag(Tag),
    Node(Node),
    Attr(Attr),
    Inline(Inline),
    Text(Text),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Tag {
    pub name: String,
    pub attrs: Vec<Attr>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Node {
    pub name: String,
    pub end: String,
    pub id: Option<String>,
    pub end_id: Option<String>,
    pub kids: Vec<Item>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Attr {
    pub key: String,
    pub val: Option<Value>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Inline {
    pub name: String,
    pub arg: Option<String>,
    pub body: InlineBody,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum InlineBody {
    Raw(String),
    Block(String),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Text {
    pub body: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Value {
    Str(String),
    Atom(String),
    Ref(String),
    Group {
        open: char,
        close: char,
        vals: Vec<Value>,
    },
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ParseError {
    pub line: usize,
    pub col: usize,
    pub msg: String,
}

#[derive(Debug)]
pub enum FileError {
    Io(std::io::Error),
    Parse(ParseError),
}

pub fn parse_str(src: &str) -> Result<Doc, ParseError> {
    Parser::new(src).doc()
}

pub fn parse_file(path: impl AsRef<Path>) -> Result<Doc, FileError> {
    let src = fs::read_to_string(path).map_err(FileError::Io)?;
    parse_str(&src).map_err(FileError::Parse)
}

impl Doc {
    pub fn pretty(&self) -> String {
        self.to_string()
    }
}

impl fmt::Display for Doc {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        for (i, item) in self.items.iter().enumerate() {
            if i > 0 {
                writeln!(f)?;
            }
            item.fmt_with(f, 0)?;
        }
        Ok(())
    }
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}:{}: {}", self.line, self.col, self.msg)
    }
}

impl std::error::Error for ParseError {}

impl fmt::Display for FileError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(err) => err.fmt(f),
            Self::Parse(err) => err.fmt(f),
        }
    }
}

impl std::error::Error for FileError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Io(err) => Some(err),
            Self::Parse(err) => Some(err),
        }
    }
}

impl Item {
    fn fmt_with(&self, f: &mut fmt::Formatter<'_>, depth: usize) -> fmt::Result {
        match self {
            Self::Tag(tag) => tag.fmt_with(f, depth),
            Self::Node(node) => node.fmt_with(f, depth),
            Self::Attr(attr) => attr.fmt_with(f, depth, true),
            Self::Inline(inline) => inline.fmt_with(f, depth),
            Self::Text(text) => text.fmt_with(f, depth),
        }
    }
}

impl Tag {
    fn fmt_with(&self, f: &mut fmt::Formatter<'_>, depth: usize) -> fmt::Result {
        write!(f, "{}{{{}", pad(depth), self.name)?;
        for attr in &self.attrs {
            write!(f, " ")?;
            attr.fmt_inner(f, false)?;
        }
        write!(f, " /}}")
    }
}

impl Node {
    fn fmt_with(&self, f: &mut fmt::Formatter<'_>, depth: usize) -> fmt::Result {
        write!(f, "{}[{}", pad(depth), self.name)?;
        if let Some(id) = &self.id {
            write!(f, " $:{id}")?;
        }
        writeln!(f, "]")?;
        for (i, kid) in self.kids.iter().enumerate() {
            if i > 0 {
                writeln!(f)?;
            }
            kid.fmt_with(f, depth + 1)?;
        }
        if !self.kids.is_empty() {
            writeln!(f)?;
        }
        write!(f, "{}[/{}", pad(depth), self.end)?;
        if let Some(id) = &self.end_id {
            write!(f, " $:{id}")?;
        }
        write!(f, "]")
    }
}

impl Attr {
    fn fmt_with(&self, f: &mut fmt::Formatter<'_>, depth: usize, slash: bool) -> fmt::Result {
        write!(f, "{}", pad(depth))?;
        self.fmt_inner(f, slash)
    }

    fn fmt_inner(&self, f: &mut fmt::Formatter<'_>, slash: bool) -> fmt::Result {
        write!(f, "({}", self.key)?;
        if let Some(val) = &self.val {
            write!(f, "=")?;
            val.fmt_with(f)?;
        }
        if slash {
            write!(f, " /)")
        } else {
            write!(f, ")")
        }
    }
}

impl Inline {
    fn fmt_with(&self, f: &mut fmt::Formatter<'_>, depth: usize) -> fmt::Result {
        write!(f, "{}[[{}", pad(depth), self.name)?;
        if let Some(arg) = &self.arg {
            write!(f, "({arg})")?;
        }
        match &self.body {
            InlineBody::Raw(body) => write!(f, "] -> {} /]", body.trim()),
            InlineBody::Block(body) => {
                write!(f, "] -> {{")?;
                if !body.is_empty() {
                    for line in body.lines() {
                        writeln!(f)?;
                        write!(f, "{}{}", pad(depth + 1), line)?;
                    }
                    writeln!(f)?;
                    write!(f, "{}}} /]", pad(depth))
                } else {
                    write!(f, "}} /]")
                }
            }
        }
    }
}

impl Text {
    fn fmt_with(&self, f: &mut fmt::Formatter<'_>, depth: usize) -> fmt::Result {
        writeln!(f, "{}{TXT_BEG}", pad(depth))?;
        if !self.body.is_empty() {
            for line in self.body.lines() {
                writeln!(f, "{}{}", pad(depth + 1), line)?;
            }
        }
        write!(f, "{}{TXT_END}", pad(depth))
    }
}

impl Value {
    fn fmt_with(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Str(val) => write!(f, "\"{}\"", esc(val)),
            Self::Atom(val) => write!(f, "{val}"),
            Self::Ref(val) => write!(f, "$:{val}"),
            Self::Group { open, close, vals } => {
                write!(f, "{open}")?;
                for (i, val) in vals.iter().enumerate() {
                    if i > 0 {
                        write!(f, ", ")?;
                    }
                    val.fmt_with(f)?;
                }
                write!(f, "{close}")
            }
        }
    }
}

struct Parser<'a> {
    src: &'a str,
    pos: usize,
    line: usize,
    col: usize,
}

impl<'a> Parser<'a> {
    fn new(src: &'a str) -> Self {
        Self {
            src,
            pos: 0,
            line: 1,
            col: 1,
        }
    }

    fn doc(&mut self) -> Result<Doc, ParseError> {
        let mut items = Vec::new();
        self.ws();
        while !self.eof() {
            items.push(self.item()?);
            self.ws();
        }
        Ok(Doc { items })
    }

    fn item(&mut self) -> Result<Item, ParseError> {
        if self.starts(TXT_BEG) {
            return Ok(Item::Text(self.text()?));
        }
        if self.starts("[[") {
            return Ok(Item::Inline(self.inline()?));
        }
        if self.starts("[/") {
            return self.err("unexpected closing tag");
        }
        if self.starts("[") {
            return Ok(Item::Node(self.node()?));
        }
        if self.starts("{") {
            return Ok(Item::Tag(self.tag()?));
        }
        if self.starts("(") {
            return Ok(Item::Attr(self.attr()?));
        }
        self.err("unexpected token")
    }

    fn tag(&mut self) -> Result<Tag, ParseError> {
        self.expect('{')?;
        self.ws();
        let name = self.take_name(&[' ', '\t', '\n', '\r', '(', '/', '}'])?;
        let mut attrs = Vec::new();
        loop {
            self.ws();
            if self.starts("/}") {
                self.bump_str("/}");
                break;
            }
            if self.starts("(") {
                attrs.push(self.tag_attr()?);
                continue;
            }
            return self.err("expected attribute or /}");
        }
        Ok(Tag { name, attrs })
    }

    fn node(&mut self) -> Result<Node, ParseError> {
        self.expect('[')?;
        let name = self.take_name(&[' ', '\t', '\n', '\r', ']'])?;
        self.ws();
        let id = if self.starts("$:") {
            Some(self.take_ref()?)
        } else {
            None
        };
        self.ws();
        self.expect(']')?;

        let mut kids = Vec::new();
        loop {
            self.ws();
            if self.starts("[/") {
                break;
            }
            if self.eof() {
                return self.err(format!("unclosed tag [{name}]"));
            }
            kids.push(self.item()?);
        }

        let (end, end_id) = self.end_tag()?;
        if !same_end(&name, &end) {
            return self.err(format!(
                "mismatched closing tag: expected {name}, got {end}"
            ));
        }
        if id != end_id {
            return self.err(format!("mismatched ids in tag {name}"));
        }

        Ok(Node {
            name,
            end,
            id,
            end_id,
            kids,
        })
    }

    fn end_tag(&mut self) -> Result<(String, Option<String>), ParseError> {
        self.bump_str("[/");
        let name = self.take_name(&[' ', '\t', '\n', '\r', ']'])?;
        self.ws();
        let id = if self.starts("$:") {
            Some(self.take_ref()?)
        } else {
            None
        };
        self.ws();
        self.expect(']')?;
        Ok((name, id))
    }

    fn attr(&mut self) -> Result<Attr, ParseError> {
        self.expect('(')?;
        let attr = self.attr_body()?;
        self.ws();
        if self.starts("/)") {
            self.bump_str("/)");
            Ok(attr)
        } else {
            self.err("expected /)")
        }
    }

    fn tag_attr(&mut self) -> Result<Attr, ParseError> {
        self.expect('(')?;
        let attr = self.attr_body()?;
        self.ws();
        self.expect(')')?;
        Ok(attr)
    }

    fn attr_body(&mut self) -> Result<Attr, ParseError> {
        self.ws();
        let key = self.take_name(&[' ', '\t', '\n', '\r', '=', '/', ')'])?;
        self.ws();
        let val = if self.peek() == Some('=') {
            self.bump();
            self.ws();
            Some(self.val()?)
        } else {
            None
        };
        Ok(Attr { key, val })
    }

    fn val(&mut self) -> Result<Value, ParseError> {
        self.ws();
        match self.peek() {
            Some('"') => Ok(Value::Str(self.string()?)),
            Some('[') => self.group('[', ']'),
            Some('{') => self.group('{', '}'),
            Some('$') if self.starts("$:") => Ok(Value::Ref(self.take_ref()?)),
            Some(_) => Ok(Value::Atom(
                self.take_name(&[' ', '\t', '\n', '\r', ',', ')', ']', '}'])?,
            )),
            None => self.err("expected value"),
        }
    }

    fn group(&mut self, open: char, close: char) -> Result<Value, ParseError> {
        self.expect(open)?;
        self.ws();
        let mut vals = Vec::new();
        if self.peek() == Some(close) {
            self.bump();
            return Ok(Value::Group { open, close, vals });
        }
        loop {
            vals.push(self.val()?);
            self.ws();
            if self.peek() == Some(',') {
                self.bump();
                self.ws();
                continue;
            }
            self.expect(close)?;
            break;
        }
        Ok(Value::Group { open, close, vals })
    }

    fn inline(&mut self) -> Result<Inline, ParseError> {
        self.bump_str("[[");
        let name = self.take_name(&[' ', '\t', '\n', '\r', ']', '('])?;
        self.ws();
        let arg = if self.peek() == Some('(') {
            Some(self.take_balanced('(', ')')?.trim().to_string())
        } else {
            None
        };
        self.ws();
        self.expect(']')?;
        self.ws();
        if self.starts("->") {
            self.bump_str("->");
        } else {
            return self.err("expected ->");
        }
        self.ws();
        let body = if self.peek() == Some('{') {
            InlineBody::Block(clean_block(&self.take_balanced('{', '}')?))
        } else {
            InlineBody::Raw(self.take_until("/]")?.trim().to_string())
        };
        self.ws();
        if self.starts("/]") {
            self.bump_str("/]");
            Ok(Inline {
                name,
                arg: arg.filter(|s| !s.is_empty()),
                body,
            })
        } else {
            self.err("expected /]")
        }
    }

    fn text(&mut self) -> Result<Text, ParseError> {
        self.bump_str(TXT_BEG);
        let body = self.take_until(TXT_END)?;
        self.bump_str(TXT_END);
        Ok(Text {
            body: clean_block(&body),
        })
    }

    fn string(&mut self) -> Result<String, ParseError> {
        self.expect('"')?;
        let mut out = String::new();
        let mut escp = false;
        while let Some(ch) = self.peek() {
            self.bump();
            if escp {
                out.push(match ch {
                    'n' => '\n',
                    'r' => '\r',
                    't' => '\t',
                    '"' => '"',
                    '\\' => '\\',
                    other => other,
                });
                escp = false;
                continue;
            }
            match ch {
                '\\' => escp = true,
                '"' => return Ok(out),
                other => out.push(other),
            }
        }
        self.err("unterminated string")
    }

    fn take_ref(&mut self) -> Result<String, ParseError> {
        if !self.starts("$:") {
            return self.err("expected ref");
        }
        self.bump_str("$:");
        self.take_name(&[' ', '\t', '\n', '\r', ',', ')', ']', '}'])
    }

    fn take_balanced(&mut self, open: char, close: char) -> Result<String, ParseError> {
        self.expect(open)?;
        let start = self.pos;
        let mut depth = 1usize;
        let mut in_str = false;
        let mut escp = false;

        while let Some(ch) = self.peek() {
            self.bump();
            if in_str {
                if escp {
                    escp = false;
                    continue;
                }
                match ch {
                    '\\' => escp = true,
                    '"' => in_str = false,
                    _ => {}
                }
                continue;
            }

            match ch {
                '"' => in_str = true,
                c if c == open => depth += 1,
                c if c == close => {
                    depth -= 1;
                    if depth == 0 {
                        let end = self.pos - ch.len_utf8();
                        return Ok(self.src[start..end].to_string());
                    }
                }
                _ => {}
            }
        }

        self.err(format!("unterminated {open}{close} block"))
    }

    fn take_until(&mut self, pat: &str) -> Result<String, ParseError> {
        let rest = self.rest();
        if let Some(off) = rest.find(pat) {
            let end = self.pos + off;
            let out = self.src[self.pos..end].to_string();
            self.bump_str(&self.src[self.pos..end]);
            Ok(out)
        } else {
            self.err(format!("expected {pat}"))
        }
    }

    fn take_name(&mut self, stop: &[char]) -> Result<String, ParseError> {
        let start = self.pos;
        while let Some(ch) = self.peek() {
            if stop.contains(&ch) {
                break;
            }
            self.bump();
        }
        if self.pos == start {
            self.err("expected name")
        } else {
            Ok(self.src[start..self.pos].to_string())
        }
    }

    fn ws(&mut self) {
        while matches!(self.peek(), Some(ch) if ch.is_whitespace()) {
            self.bump();
        }
    }

    fn expect(&mut self, ch: char) -> Result<(), ParseError> {
        if self.peek() == Some(ch) {
            self.bump();
            Ok(())
        } else {
            self.err(format!("expected {ch}"))
        }
    }

    fn peek(&self) -> Option<char> {
        self.rest().chars().next()
    }

    fn starts(&self, s: &str) -> bool {
        self.rest().starts_with(s)
    }

    fn rest(&self) -> &'a str {
        &self.src[self.pos..]
    }

    fn eof(&self) -> bool {
        self.pos >= self.src.len()
    }

    fn bump_str(&mut self, s: &str) {
        for _ in s.chars() {
            self.bump();
        }
    }

    fn bump(&mut self) {
        if let Some(ch) = self.peek() {
            self.pos += ch.len_utf8();
            if ch == '\n' {
                self.line += 1;
                self.col = 1;
            } else {
                self.col += 1;
            }
        }
    }

    fn err<T>(&self, msg: impl Into<String>) -> Result<T, ParseError> {
        Err(ParseError {
            line: self.line,
            col: self.col,
            msg: msg.into(),
        })
    }
}

fn same_end(open: &str, close: &str) -> bool {
    open == close || short(open) == close
}

fn short(s: &str) -> &str {
    s.rsplit("::").next().unwrap_or(s)
}

fn pad(depth: usize) -> String {
    "    ".repeat(depth)
}

fn esc(s: &str) -> String {
    let mut out = String::new();
    for ch in s.chars() {
        match ch {
            '\\' => out.push_str("\\\\"),
            '"' => out.push_str("\\\""),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            other => out.push(other),
        }
    }
    out
}

fn clean_block(s: &str) -> String {
    let s = s.replace("\r\n", "\n").replace('\r', "\n");
    let s = s.strip_prefix('\n').unwrap_or(&s);
    let s = s.strip_suffix('\n').unwrap_or(s);
    let lines: Vec<&str> = s.split('\n').collect();
    let cut = lines
        .iter()
        .filter(|line| !line.trim().is_empty())
        .map(|line| {
            line.chars()
                .take_while(|ch| *ch == ' ' || *ch == '\t')
                .count()
        })
        .min()
        .unwrap_or(0);

    let mut out = String::new();
    for (i, line) in lines.iter().enumerate() {
        if i > 0 {
            out.push('\n');
        }
        if line.trim().is_empty() {
            continue;
        }
        out.push_str(trim_left(line, cut));
    }
    out
}

fn trim_left(s: &str, n: usize) -> &str {
    let mut cut = 0usize;
    let mut off = 0usize;
    for ch in s.chars() {
        if cut >= n || (ch != ' ' && ch != '\t') {
            break;
        }
        cut += 1;
        off += ch.len_utf8();
    }
    &s[off..]
}

#[cfg(test)]
mod tests {
    use super::*;

    const EX: &str = r#"{document (t="dk")/}
[document $:tree]
    [head $:head]
        [meta $:BiU5549106oP1t14]
            (http-equiv="Content-Type" /)
            (content="text/dk; charset=UTF-8" /)
        [/meta $:BiU5549106oP1t14]
        [meta $:pQw15j9907f52W76]
            (name="viewport" /)
            (content="width=device-width, initial-scale=1.0" /)
        [/meta $:pQw15j9907f52W76]

        [title $:title]
            ===BEGIN-TEXT-CONTENT===
            Example Page
             ===END-TEXT-CONTENT===
        [/title $:title]

        [external-source $:9N5K14Oji4TYEA34]
            (content-type="stylesheet" /)
            (source-url="main.css" /)
        [/external-source $:9N5K14Oji4TYEA34]
        [internal-source $:9d4WH18qz13DKH46]
            (type="stylesheet" /)
            (content-type="text/dkstyle" /)
            ===BEGIN-TEXT-CONTENT===
             [selector::classification("page-header")] -> {
                set(background-color):  hexadecimal_value(#ffffff);
                set(margin):            5px 5px 5px 5px;
                set(position):          fixed;
             }
             [selector::internal-id("body")] -> {
                set(margin, padding):   0 0 0 0;
                set(height):            |viewport.height|;
                set(width):             |viewport.width|;
             }
             ===END-TEXT-CONTENT===
        [/internal-source $:9d4WH18qz13DKH46]
    [/head $:head]
    [body $:body]
        [element::divider $:5J90g0240Mcoi4BK]
            (user-agent-classification="header" /)
            (set-classification="page-header" /)
            [element::heading $:31JIw693kT7YG174]
                (user-agent-classification="h1" /)
                (set-identifier="main-heading" /)
                ===BEGIN-TEXT-CONTENT===
                My New Book
                 ===END-TEXT-CONTENT===
            [/heading $:31JIw693kT7YG174]
        [/divider $:5J90g0240Mcoi4BK]
        [element::paragraph $:H4z8hp2z5796X860]
            (user-agent-classification="p" /)
            (set-classification="example" /)
            [[inline-styling] -> {
                font-family:    "Computer Modern", "Times New Roman", system-ui, serif;
                text-color:     hexadecimal_value(#000000);
            } /]
            ===BEGIN-TEXT-CONTENT===
            The moon loomed high \elipses
             ===END-TEXT-CONTENT===
        [/paragraph $:H4z8hp2z5796X860]
    [/body $:body]
[/document $:tree]
"#;

    #[test]
    fn parses_example() {
        let doc = parse_str(EX).unwrap();
        assert_eq!(doc.items.len(), 2);
        let pretty = doc.pretty();
        let reparsed = parse_str(&pretty).unwrap();
        assert_eq!(doc, reparsed);
    }

    #[test]
    fn parses_groups() {
        let src = r#"[node $:a]
    (bind-ref=$:b /)
    (event-handler={"click", $:c} /)
    (event-trigger=["load", "blur"] /)
[/node $:a]
"#;
        let doc = parse_str(src).unwrap();
        let pretty = doc.pretty();
        let reparsed = parse_str(&pretty).unwrap();
        assert_eq!(doc, reparsed);
    }
}
