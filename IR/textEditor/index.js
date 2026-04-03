import { readFile } from "node:fs/promises";

import express from "express";
import { rateLimit } from "express-rate-limit";

const app = express();

const limit = rateLimit({
  windowMs: 30 * 60 * 1000,
  limit: 200, // if you have a legitimate reason to be visiting 200 times in half an hour, please tell me
  standardHeaders: "draft-6",
  legacyHeaders: false,
  ipv6Subnet: 64,
  message: "Too many requests in half an hour",
});

app.use(express.json());
app.use(limit);

app.get("/", async (req, res) => {
  const data = await readFile("index.html", "utf8");

  res.setHeader("Content-Type", "text/html");
  res.status(200);
  return res.send(data);
});

app.listen(3000);
