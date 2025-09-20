#pragma once

#include <vector>

#include "Element.hpp"
#include "Tuple.hpp"
#include "Unknown.hpp"

class Document {
  public:
    Element createElement(std::string type);
    std::vector<Element> getChildren();
  private:
    std::vector<Element> children;
};
