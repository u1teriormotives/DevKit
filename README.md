# DevKit
the future of rendering the Internet and its dependencies

---

## What exactly *is* DevKit?
DevKit—as it is planned to be—is a Rust-based browser engine that renders schema-based
webpages that makes use of the GPU more often than normal browser engines generally
do.

Essentially:
- It requests information from a server,
- it looks at the information (an XHTML-like successor intermediate representative markup syntax),
- and it renders it according to the spec;
- finally, it executes scripts in place, when appropriate.

## What makes DevKit “the future”?
Rather than only allowing for *one* language to rule them all, DevKit plans to support
libraries in separate programming languages that compile down to allow for webpage, styling,
and script generation in whatever language you're most comfortable in writing; think of
it like a framework (React, Preact, Next, Nuxt, *et cetera*) without the virtual DOM.

The list of languages planned to be supported are:
- JavaScript & TypeScript (node.js, deno, bun, other runtimes),
- Python,
- Java,
- Lua,
- C#,
- Swift,
- Go,
- Kotlin,
- Dart,
- and many more.

## But why should we implement it into our browser instead of WebKit, Gecko, Blink, QT, or something else that people actually use?
Because I said so.

In all seriousness, there's no real reason to choose on engine over another. Some run
faster on some operating systems or architectures, some run slower; all that matters is that
you implement *something* for some reason other than “because others are doing it.”

I get that it's hard to give up just forking Chromium or Firefox and building your own browser
off of that, but there will be no innovation if all we do is build off of the old rather than
make something new.

Figure out what engine best fits your project, and if it just so happens to be DevKit, then
yay! If not, okay, that's perfectly fine.

---

# Links, Bulletin, and To-dos:

- [Trello](https://trello.com/b/jHqNVvh4/devkit-timeline)



- The router written for `Node.js` is mostly finished, and `DKRoute.json` syntax is mostly finalized; some changes may be made here and again.
- Miller rewrote my rewrite of the rewrite of the package manager, and now it's both functional *and* pretty; and it has most of the completions for `zsh`!
- The best way to install the `Node.js`-based router is through the package manager, which can be installed best through [this repo](https://github.com/u1teriormotives/DKPM-Deno)
- We *technically* have a website now; it's hosted at [vtf.u1t.dev](https://vtf.u1t.dev), but the project page is essentially blank right now.



- Unfortunately, I cannot start working on the libraries because I need to work on the actual rendering engine.
  - I am *very* good at working on everything but it, and that's because I utterly despise all documentation surrounding the `wgpu` crate.
    - Get me better documentation on it, and I'll actually work on it using that; else, I'll have to find something else that interfaces with native graphical libraries *and* has good documentation. (No, `learn wgpu` is **not** a good tutorial. It sucks. It doesn't explain enough of the right stuff, and it explains too much on stuff that doesn't matter when you already understand a lot of the stuff.)
- Sooner or later, I'm going to have to write an actual spec on the pipeline and other processes regarding rendering and making requests.
- I might end up making my own DNS resolver and requests library depending on how much I feel like programming stuff.
