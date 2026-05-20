/** @format */

// deno-lint-ignore-file no-namespace
export namespace Resolution {
  export function resolveEndpoint(EndpointName: string): Readonly<string> {
    switch (EndpointName) {
      case "apikey":
      case "keygen":
        return "https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Libraries/APIKeyGenerator.c";
      case "dkroute":
        return "https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/DKRoute.json";
      case "index.html":
        return "https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/generic_index.html";
      case "route-js":
        return "https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/JavaScript/index.js";
      case "prettierrc":
        return "https://github.com/u1teriormotives/DevKit-Pastes/raw/refs/heads/main/.prettierrc";
      case "clang-format":
        return "https://github.com/u1teriormotives/DevKit-Pastes/raw/refs/heads/main/.clang-format";
    }
    return "https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/README.md";
  }
}
