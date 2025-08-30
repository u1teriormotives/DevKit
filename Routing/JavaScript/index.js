#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import express from "express";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`🛠 Middleware detected: ${req.method} ${req.url}`);
  req.isDevKitRequest = req.headers["user-agent"]?.includes("DevKit") || false;
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
const isValidHTTPVerb = (verb) => verbs.has(verb);
const basicWASMlangs = new Set(["js", "javascript", "html", "css"]);
const basicWASMMIMEs = new Map(
  Object.entries({
    js: "text/javascript",
    javascript: "text/javascript",
    html: "text/html",
    css: "text/css",
  })
);
const getBasicMIME = (type) => basicWASMMIMEs.get(type) || "text/plain";
const isValidBaseWASM = (type) => basicWASMlangs.has(type.toLowerCase());

const setupRoute = (obj, func) => {
  const reqType = obj.requestType?.toLowerCase();
  console.log(`🔹 Setting up route: ${obj.route} [${reqType}]`);

  app[reqType](obj.route, async (req, res) => {
    console.log(`📥 Incoming ${req.method} request: ${req.url}`);

    if (func && typeof func === "function") {
      console.log(`🔧 Custom handler for ${obj.route}`);
      return func(req, res);
    }

    let ret =
      "This content cannot be displayed as you do not have the necessary";
    if (isValidBaseWASM(obj.type)) {
      console.log(`📖 Reading file: ${obj.file}`);
      try {
        ret = await readFile(join(__dirname, obj.file), "utf8");
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
  const dkRoutePath = join(__dirname, "DKRoute.json");
  if (!existsSync(dkRoutePath)) throw new Error("❌ DKRoute file not found!");

  const rawData = await readFile(dkRoutePath, "utf8");
  if (!isValidJSON(rawData)) throw new Error("❌ Invalid DKRoute JSON!");

  const json = JSON.parse(rawData);
  if (Array.isArray(json)) {
    for (const obj of json) {
      if (
        obj.func &&
        typeof obj.func === "string" &&
        existsSync(join(__dirname, obj.func))
      ) {
        try {
          const func = await import(join(__dirname, obj.func));
          setupRoute(obj, func.default);
        } catch (error) {
          console.error(
            `❌ Error loading function for ${obj.route}: ${error.message}`
          );
          setupRoute(obj);
        }
      } else {
        setupRoute(obj);
      }
    }
  } else {
    if (
      json.func &&
      typeof json.func === "string" &&
      existsSync(join(__dirname, json.func))
    ) {
      try {
        const func = await import(join(__dirname, json.func));
        setupRoute(json, func.default);
      } catch (error) {
        console.error(
          `❌ Error loading function for ${json.route}: ${error.message}`
        );
        setupRoute(json);
      }
    } else {
      setupRoute(json);
    }
  }

  app.get("/test", (req, res) => {
    console.log("📥 Test route reached!");
    res.send("✅ Test route is working!");
  });

  const PORT = process.env.PORT || 80;
  app.listen(PORT, () => {
    console.log(`🚀 DevKit Server running on port ${PORT}`);
    console.log(
      "🔍 Registered routes:",
      app._router.stack.map((r) => r.route?.path).filter(Boolean)
    );
  });
})();