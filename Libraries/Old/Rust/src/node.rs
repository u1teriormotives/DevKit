mod event_target;
use event_target::EventTarget;

pub struct Node {
    pub node_type: u16,
    pub node_name: String,
    pub base_uri: String,
    pub is_connected: bool,
    pub owner_document: Option<Box<Node>>,
    pub parent_node: Option<Box<Node>>,
    pub parent_element: Option<Box<Node>>,
    pub child_nodes: Vec<Node>,
    pub first_child: Option<Box<Node>>,
    pub last_child: Option<Box<Node>>,
    pub previous_sibling: Option<Box<Node>>,
    pub next_sibling: Option<Box<Node>>,
}

impl Node {
    pub fn append_child(&self, _node: &Node) -> () {}
    pub fn remove_child(&self, _node: &Node) -> () {}
    pub fn has_child_nodes(&self) -> bool { false }
    pub fn clone_node(&self, _deep: bool) -> Node { Node::default() }
    pub fn is_equal_node(&self, _node: &Node) -> bool { false }
}

impl std::ops::Deref for Node {
    type Target = EventTarget;
    
    fn deref(&self) -> &Self::Target {
        static EVENT_TARGET: EventTarget = EventTarget;
        &EVENT_TARGET
    }
}

impl Default for Node {
    fn default() -> Self {
        Self {
            node_type: 0,
            node_name: String::new(),
            base_uri: String::new(),
            is_connected: false,
            owner_document: None,
            parent_node: None,
            parent_element: None,
            child_nodes: Vec::new(),
            first_child: None,
            last_child: None,
            previous_sibling: None,
            next_sibling: None,
        }
    }
}