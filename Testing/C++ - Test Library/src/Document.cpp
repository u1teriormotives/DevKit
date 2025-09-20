#include <vector>

#include "Element.hpp"
#include "Tuple.hpp"
#include "Document.hpp"

Element Document::createElement(std::string type) {
  Element newChild = Element(type);
  this->children.push_back(newChild);
  return newChild;
}
std::vector<Element> Document::getChildren() {
  std::vector<Element> childs;
  childs.assign(this->children.begin(), this->children.end());
  return childs;
}
