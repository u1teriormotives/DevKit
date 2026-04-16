#!/usr/bin/env node

import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import http2 from "node:http2";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __DKROUTE_PATH = path.join(__dirname, "DKRoute.json");

const mimeTypes = new Map();
mimeTypes
  .set(".html", "text/html")
  .set(".htm", "text/html")
  .set(".css", "text/css")
  .set(".js", "application/javascript")
  .set(".json", "application/json")
  .set(".png", "image/png")
  .set(".jpg", "image/jpeg")
  .set(".jpeg", "image/jpeg")
  .set(".jpe", "image/jpeg")
  .set(".tiff", "image/tiff")
  .set(".tif", "image/tiff")
  .set(".ico", "image/x-icon")
  .set(".svg", "image/svg+xml")
  .set(".webp", "image/webp")
  .set(".csv", "text/csv")
  .set(".tsv", "application/tab-separated-values")
  .set(".dks", "text/dkstyle")
  .set(".dkx", "text/dkx");
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
    `Expected DKRoute.json at ${__DKROUTE_PATH}, file does not exist.`,
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

let useHttps = false,
  useHttp2 = false;
const opts = {
  cert: "",
  key: "",
};

const __DKROUTE_DATA_RAW = (await fs.readFile(__DKROUTE_PATH, "utf8")).trim();
if (!__DKROUTE_DATA_RAW) {
  fatalException();
  throw new Error(`No data exists in DKRoute.json (found @ ${__DKROUTE_PATH})`);
}

let __DKROUTE_DATA;
try {
  __DKROUTE_DATA = JSON.parse(__DKROUTE_DATA_RAW);
} catch {
  fatalException();
  throw new Error(`DKRoute.json is not valid JSON (found @ ${__DKROUTE_PATH})`);
}
const __DKROUTE_METADATA = __DKROUTE_DATA["$"] ?? null;
if (!__DKROUTE_METADATA) {
  fatalException();
  throw new Error(
    `No metadata found in DKRoute.json (found @ ${__DKROUTE_PATH})`,
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
const __DKRATELIMITING = {
  enabled: false,
  timeframe: 0,
  max_requests: 0,
};

if (
  __DKROUTE_METADATA.ratelimiting.enabled &&
  __DKROUTE_METADATA.ratelimiting["timeframe-m"] &&
  __DKROUTE_METADATA.ratelimiting["max-requests"]
) {
  __DKRATELIMITING.enabled = true;
  __DKRATELIMITING.timeframe =
    Number(__DKROUTE_METADATA.ratelimiting["timeframe-m"]) * 60 * 1000;
  __DKRATELIMITING.max_requests =
    __DKROUTE_METADATA.ratelimiting["max-requests"];
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
      `HTTPS Config malformed or does not exist (found @ ${__DKROUTE_PATH})`,
    );
  }

  opts["cert"] = readFileSync(
    path.join(__dirname, __DKROUTE_METADATA.httpsConfig.cert),
  );
  opts["key"] = readFileSync(
    path.join(__dirname, __DKROUTE_METADATA.httpsConfig.key),
  );
}
if (__DKROUTE_METADATA.useHttp2) useHttp2 = true;

const validRoutes = new Map();
const inputRoutes = Object.keys(__DKROUTE_DATA).filter((v) =>
  v.startsWith("/"),
);

for (const route of inputRoutes) {
  if (!Array.isArray(__DKROUTE_DATA[route])) {
    nonfatalException();
    console.error(
      `Route ${route} has invalid schema: ${typeof __DKROUTE_DATA[
        route
      ]} invalid type; looking for Array<Object>. Continuing...`,
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
        `${verb} ${route} has invalid file configuration. Continuing...`,
      );
      continue;
    }

    if (method.externalFunction) {
      let func = await import(path.join(__dirname, file));
      if (typeof func.default !== "function") {
        nonfatalException();
        console.error(
          `${verb} ${route} has invalid external function in ${file}. Continuing...`,
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
        fileType:
          method.contentType ??
          mimeTypes.get(path.extname(file)) ??
          "text/plain",
      });
      continue;
    }
  }
}

const routes = new Set();
validRoutes.forEach((v, k) => routes.add(k.split(" ", 2)[1]));

if (useHttp2 && !useHttps) {
  fatalException();
  throw new Error("You must enable HTTPS in order to HTTP/2");
}

// because intellisense is a meanie, i have to do this so i can see what i'm doing >:(
/**
 * @type {http.Server<typeof http.IncomingMessage, typeof http.OutgoingMessage>}
 */
const server = useHttp2
  ? useHttps
    ? http2.createSecureServer(opts)
    : console.log("how did you get past the throw")
  : useHttps
    ? https.createServer(opts)
    : http.createServer();

const ratelimit = new Map();

server.on("request", async (req, res) => {
  const host = req.headers.host ?? req.headers[":authority"] ?? "localhost";
  const url = new URL(`http${useHttps ? "s" : ""}://${host}${req.url}`);

  if (__DKRATELIMITING.enabled) {
    const ip = req.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    const record = ratelimit.get(ip) ?? { count: 0, windowStart: now };

    if (now - record.windowStart > __DKRATELIMITING.timeframe) {
      record.count = 0;
      record.windowStart = now;
    }
    record.count++;
    ratelimit.set(ip, record);

    if (record.count > __DKRATELIMITING.max_requests) {
      res.statusCode = 429;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader(
        "Retry-After",
        Math.ceil(
          (record.windowStart + __DKRATELIMITING.timeframe - now) / 1000,
        ),
      );
      return res.end("429 Too Many Requests");
    }
  }

  const requestId = crypto.randomUUID();
  console.log(
    `${currentTime()} :: New request detected: ${req.method ?? "REQUEST"} ${
      req.url ?? "nil"
    } - assigned RequestID:${requestId}`,
  );

  const pathname = url.pathname;
  if (!routes.has(pathname)) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end(`ERROR 404 ${req.method} ${pathname} not valid resource`);
  }

  if (
    !req.method ||
    !validRoutes.has(`${req.method?.toUpperCase()} ${pathname}`)
  ) {
    res.statusCode = 405;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    console.log(
      `${currentTime()} :: RequestID::${requestId} - invalid HTTP method (returning 405)`,
    );
    return res.end(
      `ERROR 405 ${req.method ?? "REQUEST"} ${pathname} uses incorrect method`,
    );
  }

  const data = validRoutes.get(`${req.method.toUpperCase()} ${pathname}`);
  if (!data) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.write(
      JSON.stringify({
        error: 500,
        response: "error while retrieving data; try again later",
      }),
    );
    nonfatalException();
    console.error(
      `RequestID:${requestId} - unknown error while retrieving data (returning 500)`,
    );
    console.error(
      `RequestID:${requestId} - could be that key was removed after .has() check`,
    );
    return res.end();
  }

  if (!data.external) {
    if (req.method === "HEAD") {
      const getKey = `GET ${pathname}`;
      if (!validRoutes.has(getKey)) {
        res.statusCode = 405;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.end();
      }

      const headData = validRoutes.get(getKey);
      if (!headData.external) {
        try {
          const stat = await fs.stat(headData.file);
          res.statusCode = 200;
          res.setHeader("Content-Type", headData.fileType);
          res.setHeader("Content-Length", stat.size);
          return res.end();
        } catch {
          res.statusCode = 500;
          return res.end();
        }
      } else {
        req.body = "";
        try {
          const [statusCode, headers] = await headData.func(req);
          res.writeHead(statusCode, headers);
          return res.end();
        } catch {
          res.statusCode = 500;
          return res.end();
        }
      }
    }
    try {
      const fileContent = await fs.readFile(data.file);
      const ftype = data.fileType;

      res.statusCode = 200;
      res.setHeader("Content-Type", ftype);
      res.write(fileContent);
      console.log(
        `${currentTime()} :: RequestID:${requestId} - successful (returning 200)`,
      );
      return res.end();
    } catch (error) {
      nonfatalException();
      console.error(`RequestID:${requestId} - ${error}`);
      console.log(`RequestID:${requestId} - returning 500`);

      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.end("500 error retrieving file content");
    }
  } else {
    const func = data.func;

    const MAX_BODY = 1_000_000;

    const body = ["POST", "PUT", "PATCH"].includes(req.method)
      ? await new Promise((resolve, reject) => {
          const chunks = [];
          let size = 0;

          req.on("data", (chunk) => {
            size += chunk.length;
            if (size > MAX_BODY) {
              reject(new Error("Payload too large"));
              req.destroy();
              return;
            }
            chunks.push(chunk);
          });

          req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
          req.on("error", reject);
          req.on("aborted", () => reject(new Error("Request aborted")));
        })
      : "";
    req.body = body;

    try {
      const [statusCode, headers, content] = await func(req);
      if (
        typeof statusCode !== "number" ||
        headers == null ||
        typeof headers !== "object" ||
        typeof content !== "string"
      ) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.write("500 invalid return schema");

        nonfatalException();
        console.error(
          `RequestID:${requestId} - invalid return schema for resource ${pathname} (returning 500)`,
        );
        return res.end();
      }

      res.writeHead(statusCode, headers);
      res.write(content);
      console.log(
        `${currentTime()} :: RequestID:${requestId} - successful (returning ${statusCode})`,
      );
      return res.end();
    } catch (error) {
      nonfatalException();
      console.error(
        `RequestID:${requestId} - external handler failed: ${error}`,
      );
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.end("500 internal server error");
    }
  }
});

server.listen(port, "0.0.0.0", () =>
  console.log(
    `${currentTime()} :: listening at ${
      useHttps ? "https" : "http"
    }://localhost:${port}`,
  ),
);
