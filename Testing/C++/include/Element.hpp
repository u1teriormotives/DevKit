#pragma once

#include <any>
#include <string>
#include <vector>

#include "Tuple.hpp"
#include "Unknown.hpp"

class Element {
  public:
    Element(std::string elementType);
    std::string value;
    std::vector<Tuple<std::string, std::any>> attributes;

    std::string elementType();

    bool hasAttribute(std::string attr);
    void setAttribute(std::string attr, std::any value);
    std::any getAttribute(std::string attr);
  private:
    std::string elemType;
};
