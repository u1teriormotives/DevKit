import { pathToFileURL } from "node:url";

const [, , mode, handlerPath] = process.argv;

const originalStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (...args) => process.stderr.write(...args);
console.log = (...args) => console.error(...args);
console.info = (...args) => console.error(...args);
console.debug = (...args) => console.error(...args);

try {
  const mod = await import(pathToFileURL(handlerPath).href);
  if (typeof mod.default !== "function") {
    process.exit(2);
  }

  if (mode === "validate") {
    originalStdoutWrite("ok");
    process.exit(0);
  }

  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const payloadText = Buffer.concat(chunks).toString("utf8");
  const payload = payloadText ? JSON.parse(payloadText) : {};
  const req = {
    body: payload.body ?? "",
    headers: payload.headers ?? {},
    method: payload.method,
    url: payload.url,
  };

  const result = await mod.default(req);
  originalStdoutWrite(JSON.stringify(result));
} catch (error) {
  console.error(error?.stack ?? String(error));
  process.exit(1);
}
