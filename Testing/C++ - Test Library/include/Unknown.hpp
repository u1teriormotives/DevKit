#pragma once

#include <iostream>

class Unknown {
  public:
    Unknown() {}

    Unknown(const Unknown&) {}

    void print() const {
      std::cout << "This is an unknown element.";
    }
};