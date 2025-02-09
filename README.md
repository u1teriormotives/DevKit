# DevKit
An open source rendering engine for HTML, CSS, & JS websites, but more:

Rather than sticking with traditional full-stack websites, I figured that maybe we should consider making websites in languages that aren't used for website development; perhaps we should make them entirety in those languages.

Support is planned for the following languages to be used:
- JavaScript & TypeScript
- HTML
- CSS
- Java
- Visual Basic (VB.NET & VBA)
- Python
- Lua
- WebAssembly (yes, you'll be able to make a website through pure WASM)
- Native LaTeX rendering
- C#
- Rust
- Swift
- Go
- Kotlin
- Dart
- Perl

I thought of this after figuring out that I absolutely hate React & the other engines like it because it's terrible. With DevKit, you'd basically be able to code an *entire* website through things different than standard JS, HTML, & CSS websites.

For example (Java):
```java
import devkit.engine.*;
import devkit.html.*;

public class Website {
  // App() will be the main method that DevKit looks for
  public static Page App() {
    Page index = new Page();
    H1 header = new H1("Hello, DevKit!");
    index.appendElement(header);
    return index;
  }
}
```
This would be equivalent to:
```html
<!DOCTYPE html>
<html>
  <body>
    <h1>Hello, DevKit!</h1>
  </body>
</html>
```
View the Trello board [here](https://trello.com/b/jHqNVvh4/devkit-timeline)

## Current News / Roadmap:
- Routing System:
  - Coded main functionality (yes)
  - Published to NPM (yes)
  - Add more language support (working on)
