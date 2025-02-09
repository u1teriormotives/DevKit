import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import express from "express";
import "dotenv/config";

const app = express();
app.use((req, res, next) => {
  console.log(`🛠 Middleware detected: ${req.method} ${req.url}`);
  req.headers["user-agent"].includes("DevKit")
    ? (req.isDevKitRequest = true)
    : (req.isDevKitRequest = false);
  next();
});

const isValidJSON = (text) => {
  try {
    JSON.parse(text);
    return true;
  } catch (error) {
    return false;
  }
};
const verbs = new Set([
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "head",
  "options",
  "connect",
  "trace",
]);
const basicWASMlangs = new Set([
  "js",
  "javascript",
  "application/javascript",
  "html",
  "text/html",
  "css",
  "text/css",
]);
const basicWASMMIMEs = {
  "application/javascript": new Set([
    "js",
    "javascript",
    "application/javascript",
  ]),
  "text/html": new Set(["html", "text/html"]),
  "text/css": new Set(["css", "text/css"]),
};

const getBasicMIME = (type) => {
  for (const key of Object.keys(basicWASMMIMEs)) {
    if (basicWASMMIMEs[key].has(type.toLowerCase())) return key;
  }
  return null;
};
const isValidBaseWASM = (type) => basicWASMlangs.has(type);
const isValidHTTPVerb = (verb) => verbs.has(verb);

const setupRoute = (obj) => {
  const reqType = obj.requestType?.toLowerCase();

  console.log(`🔹 Setting up route: ${obj.route} [${reqType}]`);

  app[reqType](obj.route, async (req, res) => {
    console.log(
      `📥 Incoming request: ${req.method} ${req.url} | DevKit: ${req.isDevKitRequest}`
    );

    let ret =
      "This content cannot be displayed as you do not have the necessary";

    if (isValidBaseWASM(obj.type)) {
      console.log(`📖 Reading file: ${obj.file}`);
      try {
        ret = await readFile(obj.file, "utf8");
      } catch (error) {
        console.error(`🚨 Error reading file ${obj.file}:`, error.message);
        return res
          .status(500)
          .send("🚨 Internal Server Error: File not found!");
      }
    }

    console.log("📤 Sending response...");
    res
      .status(200)
      .set(
        "Content-Type",
        isValidBaseWASM(obj.type) ? getBasicMIME(obj.type) : "text/plain"
      )
      .send(ret);
  });
};

(async () => {
  if (existsSync("DKRoute")) {
    const rawData = await readFile("DKRoute", "utf8");
    if (isValidJSON(rawData)) {
      const json = JSON.parse(rawData);
      if (Array.isArray(json)) json.forEach(setupRoute);
      else setupRoute(json);

      app.get("/test", (req, res) => {
        console.log("📥 Test route reached!");
        res.send("✅ Test route is working!");
      });

      const PORT = process.env.PORT || 80;
      app.listen(PORT, () => {
        console.log(`🚀 DevKit Server running on port ${PORT}`);
        console.log("🔍 Checking registered routes:");
        console.log(
          app._router.stack.map((r) => r.route?.path).filter(Boolean)
        );
      });
    } else throw new Error("Your DKRoute is not valid JSON!");
  } else throw new Error("You do not have a DKRoute file set up!");
})();
