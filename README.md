# DevKit
An HTTP rendering engine with a twist

---

DevKit is an HTTP rendering engine that allows for websites to be written & coded in languages such as:
- HTML
- CSS
- JavaScript/TypeScript
- Java
- Python
- Lua
- WebAssembly
- LaTeX-rendered (LaTeX is simply a first-class citizen; it eliminates the middleman of pdflatex and other tools such as that)
- C#
- Rust
- Swift
- Go
- Kotlin
- Dart
- and many others that are planned to be supported

After having learned of the horror that is React (& other frameworks like it),
I conceived the idea of DevKit as a way to simplify the uselessness of a "virtual DOM"
– by getting rid of the Virtual DOM & the DOM entirely and rendering it entirely
using the WebGPU. The first test of this is available in Applications/WebGPU Test
where you can compile the rust file yourself.

Example Syntax: (not finalized)

```java
import devkit.engine.*;
import devkit.html.*;

public class Website {
    public static Page App() {
        Page index = new Page();
        H1 header = new H1("Hello, DevKit!");
        index.body.appendChild(header);
        return index;
    }
}
```

which is equivalent to the following HTML

```html
<!DOCTYPE html>
<html>
    <body>
        <h1>Hello&comma; DevKit&excl;</h1>
    </body>
</html>
```

View the Trello board/roadmap [here](https://trello.com/b/jHqNVvh4/devkit-timeline)

---

## Summarized News & Roadmap:

- Routing System:
  - The JavaScript-implemented router is (mostly) made;
  - It can be installed via `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/u1t-dev/DevKit/refs/heads/main/Request%20Routing/JS/install.sh)"`
  - It will likely be rewritten in the future to be more up to my standards
- To see compiled code (i.e., WASM tests & generated JavaScript), you can see the pastes [here](https://github.com/u1t-dev/DevKit-Pastes)
- The first successful test of the WGPU renderer using my IR syntax is available under Applications/WebGPU Test (written in rust)
