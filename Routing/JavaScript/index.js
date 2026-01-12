#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __DKROUTE_PATH = path.join(__dirname, "DKRoute.json");

const currentTime = () => {
  const now = new Date();
  const hours =
    now.getHours() < 10 ? `0${now.getHours()}` : `${now.getHours()}`;
  const minutes =
    now.getMinutes() < 10 ? `0${now.getMinutes()}` : `${now.getMinutes()}`;
  return `\x1b[4;94;40mDEVKIT\x1b[0m::\x1b[4;94;40m${hours}:${minutes}\x1b[0m`;
};
const fatalException = () =>
  console.error(`${currentTime()} :: \x1b[41mFATAL EXCEPTION\x1b[0m`);
const nonfatalException = () =>
  console.error(`${currentTime()} :: \x1b[44mNONFATAL EXCEPTION\x1b[0m`);

if (!existsSync(__DKROUTE_PATH)) {
  fatalException();
  throw new Error(
    `Expected DKRoute.json at ${__DKROUTE_PATH}, file does not exist.`
  );
}

const validVerbs = new Set([
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
const MIME = new Map();
MIME.set("html", "text/html");
MIME.set("js", "text/javascript");
MIME.set("json", "application/json");
MIME.set("css", "text/css");
let useHttps = false;
const httpsOptions = {
  cert: "",
  key: "",
};

const __DKROUTE_DATA_RAW = (await fs.readFile(__DKROUTE_PATH, "utf8")).trim();
if (!__DKROUTE_DATA_RAW) {
  fatalException();
  throw new Error(`No data exists in DKRoute.json (found @ ${__DKROUTE_PATH})`);
}

const __DKROUTE_DATA = JSON.parse(__DKROUTE_DATA_RAW);
const __DKROUTE_METADATA = __DKROUTE_DATA["$"] ?? null;
if (!__DKROUTE_METADATA) {
  fatalException();
  throw new Error(
    `No metadata found in DKRoute.json (found @ ${__DKROUTE_PATH})`
  );
}
if (!__DKROUTE_METADATA.port) {
  fatalException();
  throw new Error(`No port found in DKRoute.json (found @ ${__DKROUTE_PATH})`);
}
const port = __DKROUTE_METADATA.port;
if (typeof port !== "number" || port > 65535 || port < 0) {
  fatalException();
  throw new Error(`Port provided (${port}) invalid`);
}

if (__DKROUTE_METADATA.useHttps) {
  useHttps = true;
  if (
    !__DKROUTE_METADATA.httpsConfig ||
    !__DKROUTE_METADATA.httpsConfig.cert ||
    !__DKROUTE_METADATA.httpsConfig.key
  ) {
    fatalException();
    throw new Error(
      `HTTPS Config malformed or does not exist (found @ ${__DKROUTE_PATH})`
    );
  }

  httpsOptions["cert"] = readFileSync(
    path.join(__dirname, __DKROUTE_METADATA.httpsConfig.cert)
  );
  httpsOptions["key"] = readFileSync(
    path.join(__dirname, __DKROUTE_METADATA.httpsConfig.key)
  );
}

const validRoutes = new Map();
const inputRoutes = Object.keys(__DKROUTE_DATA).filter((v) =>
  v.startsWith("/")
);

for (const route of inputRoutes) {
  if (!Array.isArray(__DKROUTE_DATA[route])) {
    nonfatalException();
    console.error(
      `Route ${route} has invalid schema: ${typeof __DKROUTE_DATA[
        route
      ]} invalid type; looking for Array<Object>. Continuing...`
    );
    continue;
  }
  for (const method of __DKROUTE_DATA[route]) {
    const verb = method.requestType;
    if (
      !verb ||
      typeof verb !== "string" ||
      !validVerbs.has(verb.toLowerCase())
    ) {
      nonfatalException();
      console.error(`${verb} ${route} has invalid requestType. Continuing...`);
      continue;
    }

    const file = method.file;
    if (
      !file ||
      typeof file !== "string" ||
      !existsSync(path.join(__dirname, file))
    ) {
      nonfatalException();
      console.error(
        `${verb} ${route} has invalid file configuration. Continuing...`
      );
      continue;
    }

    if (method.externalFunction) {
      let func = await import(path.join(__dirname, file));
      if (typeof func.default !== "function") {
        nonfatalException();
        console.error(
          `${verb} ${route} has invalid external function in ${file}. Continuing...`
        );
        func = null;
        continue;
      }
      validRoutes.set(`${verb.toUpperCase()} ${route}`, {
        external: true,
        func: func.default,
      });
      continue;
    } else {
      validRoutes.set(`${verb.toUpperCase()} ${route}`, {
        external: false,
        file: path.join(__dirname, file),
        fileType: method.contentType ?? "txt",
      });
      continue;
    }
  }
}

const routes = new Set();
validRoutes.forEach((v, k) => routes.add(k.split(" ", 2)[1]));

let server;
if (useHttps) server = https.createServer(httpsOptions);
else server = http.createServer();

server.on("request", async (req, res) => {
  const requestId = randomUUID();
  console.log(
    `${currentTime()} :: New request detected: ${req.method ?? "REQUEST"} ${
      req.url ?? "nil"
    } - assigned RequestID:${requestId}`
  );
  const url = new URL(
    `http${useHttps ? "s" : ""}://${process.env.HOST ?? "localhost"}${req.url}`
  );

  const pathname = url.pathname;
  if (!routes.has(pathname)) {
    res.writeHead(404, { "content-type": req.headers.accept ?? "text/plain" });
    console.log(
      `${currentTime()} :: RequestID:${requestId} - invalid resource request (returning 404)`
    );
    return res.end(`ERROR 404 ${req.method} ${pathname} not valid resource`);
  }
  if (
    !req.method ||
    !validRoutes.has(`${req.method?.toUpperCase()} ${pathname}`)
  ) {
    res.writeHead(405, { "content-type": req.headers.accept ?? "text/plain" });
    console.log(
      `${currentTime()} :: RequestID::${requestId} - invalid HTTP method (returing 405)`
    );
    return res.end(
      `ERROR 405 ${req.method ?? "REQUEST"} ${pathname} uses incorrect method`
    );
  }

  const data = validRoutes.get(`${req.method.toUpperCase()} ${pathname}`);
  if (!data) {
    res.writeHead(500, { "content-type": "application/json" });
    res.write(
      JSON.stringify({
        error: 500,
        response: "error while retrieving data; try again later",
      })
    );
    nonfatalException();
    console.error(
      `RequestID:${requestId} - unknown error while retrieving data (returing 500)`
    );
    console.error(
      `RequestID:${requestId} - could be that key was removed after .has() check`
    );
    return res.end();
  }

  if (!data.external) {
    try {
      const fileContent = await fs.readFile(data.file, "utf8");
      const ftype = data.fileType;

      res.writeHead(200, {
        "content-type": MIME.has(ftype) ? MIME.get(ftype) : "text/plain",
      });
      res.write(fileContent);
      console.log(
        `${currentTime()} :: RequestID:${requestId} - successful (returing 200)`
      );
      return res.end();
    } catch (error) {
      nonfatalException();
      console.error(`RequestID:${requestId} - ${error}`);
      console.log(`RequestID:${requestId} - returning 500`);

      res.writeHead(500, {
        "content-type": "text/plain",
      });
      return res.end("500 error retrieving file content");
    }
  } else {
    const func = data.func;
    const [statusCode, headers, content] = func(req);
    if (
      !statusCode ||
      !headers ||
      !content ||
      typeof statusCode !== "number" ||
      !(headers instanceof Object) ||
      typeof content !== "string"
    ) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.write("500 invalid return schema");

      nonfatalException();
      console.error(
        `RequestID:${requestId} - invalid return schema for resource ${pathname} (returning 500)`
      );
      return res.end();
    }

    res.writeHead(statusCode, headers);
    res.write(content);
    console.log(
      `${currentTime()} :: RequestID:${requestId} - successful (returing 200)`
    );
    return res.end();
  }
});

server.listen(port, "0.0.0.0", () =>
  console.log(
    `${currentTime()} :: listening at ${
      useHttps ? "https" : "http"
    }://localhost:${port}`
  )
);

process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
