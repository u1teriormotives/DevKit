import { readFile } from "node:fs/promises";

import express from "express";

const app = express();
app.use(express.json());

app.get("/", async (req, res) => {
  const data = await readFile("index.html", "utf8");

  res.setHeader("Content-Type", "text/html");
  res.status(200);
  return res.send(data);
});

app.listen(3000);
