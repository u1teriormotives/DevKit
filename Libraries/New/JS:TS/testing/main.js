import element from "../out/Element.js";

(() => {
  const elem = new element("header");
  elem.textContent = "Hello, world!";
  console.log(elem.toString());
})();