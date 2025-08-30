pub struct EventTarget;
impl EventTarget {
    pub fn addEventListener(&self, _ev: &str) -> () {}
    pub fn removeEventListener(&self, _ev: &str) -> () {}
    pub fn dispatchEvent(&self, _ev: &str) -> () {}
}