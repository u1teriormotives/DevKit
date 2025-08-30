#ifndef TUPLE_HPP
#define TUPLE_HPP

#include <iostream>

template <typename A, typename B>
class Tuple {
  private:
    A val1;
    B val2;
  
  public:
    Tuple(const A& arg1, const B& arg2) : val1(arg1), val2(arg2) {}

    ~Tuple() {}

    A getFirst() const {
      return val1;
    }
    B getSecond() const {
      return val2;
    }

    void print() const {
      std::cout << "Tuple(" << val1 << ", " << val2 << ")\n";
    }
};

#endif // TUPLE_HPP