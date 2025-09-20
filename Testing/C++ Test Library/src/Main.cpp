#include <any>
#include <iostream>

#include "Document.hpp"
#include "Element.hpp"

int main() {
  Document document;

  Element header = document.createElement("h1");
  header.value = "Hello, world!";

  header.setAttribute("id", 1);

  std::any output = header.getAttribute("id");
  if (output.has_value()) {
    try {
      std::cout << "Value: " << std::any_cast<int>(output) << std::endl;
    }
    catch(const std::bad_any_cast& e) {
      std::cerr << "Bad cast: " << e.what() << std::endl;
    }
  } else {
    std::cerr << "Attribute not found!" << std::endl;
  }
}