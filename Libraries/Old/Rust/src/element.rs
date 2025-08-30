mod node;
mod event_target;
use event_target::EventTarget;
use node::Node;
use std::any::Any;

enum NoS {
    Node(Node),
    String(String)
}

pub struct Element {
    assigned_slot: Option<Box<Node>>,
    attributes: Vec<String>,
    child_element_count: u16,
    children: Vec<Element>,
    class_list: Vec<String>,
    class_name: String,
    client_height: u16,
    client_left: u16,
    client_top: u16,
    client_width: u16,
    current_css_zoom: u16,
    element_timing: String,
    id: String,
    inner_html: String,
    last_element_child: Option<Box<Element>>,
    local_name: String,
    namespace_uri: String,
    next_element_sibling: Option<Box<Element>>,
    outer_html: String,
    part: Vec<Node>,
    prefix: String,
    previous_element_sibling: Option<Box<Element>>,
    scroll_height: u16,
    scroll_left: u16,
    scroll_top: u16,
    scroll_width: u16,
    shadow_root: Option<Box<Node>>,
    slot: Option<Box<Element>>,
    tag_name: String
}
impl Element {
    pub fn after(&self, _elems: Vec<Node>) -> () {}
    pub fn animate(&self, _anim: Box<dyn Any>) -> () {}
    pub fn append(&self, _elems: Vec<NoS>) -> () {}
    pub fn before(&self, _elems: Vec<Node>) -> () {}
    pub fn check_visibility(&self) -> bool {}
    pub fn closest(&self) -> Option<Box<Element>> {}
    pub fn computed_style_map(&self) -> Box<dyn Any> {}
    pub fn get_animations(&self) -> Vec<Box<dyn Any>> {}
    pub fn get_attribute(&self, _attr: String) -> String {}
    pub fn get_attribute_names(&self) -> Vec<String> {}
    pub fn get_attribute_node(&self, _attr: String) -> String {}
    pub fn get_attribute_ns(&self, _attr: String) -> String {}
    pub fn get_bounding_client_rect(&self) -> i32 {}
    pub fn get_client_rects(&self) -> Vec<i32> {}
    pub fn get_elements_by_class_name(&self, _cn: String) -> Vec<Element> {}
    pub fn get_elements_by_tag_name(&self, _tn: String) -> Vec<Element> {}
    pub fn get_elements_by_tag_name_ns(&self, _tn: String) -> Vec<Element> {}
    pub fn get_html(&self, _include_shadow: bool) -> String {}
    pub fn has_attribute(&self, _attr: String) -> bool {}
    pub fn has_attribute_ns(&self, _attr: String) -> bool {}
    pub fn has_attributes(&self, _attrs: Vec<String>) -> bool {}
    pub fn has_pointer_capture(&self, _id: String) -> bool {}
    pub fn insert_adjacent_element(&self, _elem: Element) -> () {}
    pub fn insert_adjacent_html(&self, _str: String) -> () {}
    pub fn insert_adjacent_text(&self, _str: String) -> () {}
    pub fn matches(&self, _str: String) -> bool {}
    pub fn prepend(&self, _elems: Vec<NoS>) -> () {}
    pub fn query_selector(&self, _query: String) -> Node {}
    pub fn query_selector_all(&self, _query: String) -> Vec<Node> {}
    pub fn release_pointer_capture(&self, _pc: Box<dyn Any>) -> () {}
    pub fn remove(&self) -> () {}
    pub fn remove_attribute(&self, _attr: String) -> () {}
    pub fn remove_attribute_node(&self, _attr: Node) -> () {}
    pub fn remove_attribute_ns(&self, _attr: String) -> () {}
    pub fn replace_children(&self, _children: Vec<Node>) -> () {}
    pub fn replace_with(&self, _new: Vec<NoS>) -> () {}
    pub async fn request_fullscreen(&self) -> () {}
    pub async fn request_pointer_lock(&self) -> () {}
    pub fn scroll(&self, _coords: (i64, i64)) -> () {}
    pub fn scroll_by(&self, _am: i64) -> () {}
    pub fn scroll_into_view(&self) -> () {}
    pub fn scroll_to(&self, _coords: (i64, i64)) -> () {}
    pub fn set_attribute(&self, _attr: String, _value: Box<dyn Any>) -> () {}
    pub fn set_attribute_node(&self, _attr: String, _value: Box<dyn Any>) -> () {}
    pub fn set_attribute_node_ns(&self, _attr: String, _value: Box<dyn Any>) -> () {}
    pub fn set_attribute_ns(&self, _attr: String, _value: Box<dyn Any>) -> () {}
    pub fn set_html_unsafe(&self, _html: String) -> () {}
    pub fn set_pointer_capture(&self, _pc: Box<dyn Any>) -> () {}
    pub fn toggle_attribute(&self, _attr: String) -> () {}
}

impl std::opt::Deref for Element {
    type Target = Node;
    fn deref(&self) -> &Self::Target {
        static NODE: Node = Node;
        &NODE;
    }
}