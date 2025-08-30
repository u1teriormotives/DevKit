#include <any>
#include <string>
#include <vector>

#include "Tuple.hpp"
#include "Unknown.hpp"
#include "Element.hpp"

Element::Element(std::string elementType) {
  this->elemType = elementType;
}

std::string Element::elementType() {
  return this->elemType;
}

bool Element::hasAttribute(std::string attr) {
  for (size_t i = 0; i < this->attributes.size(); i++) {
    if (this->attributes[i].getFirst() == attr) return true;
  }
  return false;
}

void Element::setAttribute(std::string attr, std::any value) {
  for (size_t i = 0; i < this->attributes.size(); i++) {
    if (this->attributes[i].getFirst() == attr) {
      this->attributes[i] = Tuple<std::string, std::any>(attr, value);
      return;
    }
  }
  this->attributes.push_back(Tuple<std::string, std::any>(attr, value));
}

std::any Element::getAttribute(std::string attr) {
  for (size_t i = 0; i < this->attributes.size(); i++) {
    if (this->attributes[i].getFirst() == attr) {
      return this->attributes[i].getSecond();
    }
  }
  return Unknown();
}
