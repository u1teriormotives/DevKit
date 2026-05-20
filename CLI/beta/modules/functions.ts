/** @format */

import { writeFile } from "node:fs/promises";
import process from "node:process";

import * as DK from "./typing.ts";

const Colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blueBg: "\x1b[44;97m",
  redBg: "\x1b[41;97m",
  yellowBg: "\x1b[43;30m",
};

function Paint(text: string, ...styles: string[]): string {
  return `${styles.join("")}${text}${Colors.reset}`;
}

export function GetTime(): DK.Timeperiod {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = `${hours < 10 ? `0${hours}` : hours}:${
    minutes < 10 ? `0${minutes}` : minutes
  }`;

  return `${Paint("DEVKIT", Colors.blueBg)} ${Paint(time, Colors.cyan)}`;
}

export function LogStep(message: string): void {
  console.log(`${GetTime()} ${Paint(">", Colors.dim)} ${message}`);
}

export function LogSuccess(message: string): void {
  console.log(
    `${GetTime()} ${Paint("OK", Colors.green, Colors.bold)} ${message}`
  );
}

export function LogWarning(message: string): void {
  console.error(
    `${GetTime()} ${Paint("WARN", Colors.yellow, Colors.bold)} ${message}`
  );
}

export function LogError(message: string): void {
  console.error(
    `${GetTime()} ${Paint("ERR", Colors.red, Colors.bold)} ${message}`
  );
}
export function FatalException(code: number | string, message: string): void {
  console.error(`${Paint(" FATAL EXCEPTION ", Colors.redBg, Colors.bold)}
${GetTime()} ${Paint("code", Colors.dim)} ${code}
${Paint(message, Colors.red)}`);
  process.exit(1);
}
export function NonfatalException(
  code: number | string,
  message: string
): void {
  console.error(`${Paint(" NONFATAL EXCEPTION ", Colors.yellowBg, Colors.bold)}
${GetTime()} ${Paint("code", Colors.dim)} ${code}
${Paint(message, Colors.yellow)}`);
}

export async function FetchEndpoint(
  endpoint: Readonly<string>,
  filepath: string,
  headers: object | undefined,
  mode: DK.DK.FileMode
): Promise<void> {
  if (endpoint === "null") {
    return FatalException(0xf0000 | 404, "resource does not exist");
  }

  LogStep(`GET ${Paint(endpoint, Colors.cyan)}`);
  const req = await fetch(endpoint, {
    method: "GET",
    headers: headers ?? {},
  });

  LogStep(`response ${Paint(String(req.status), Colors.bold)}`);
  if (req.status !== 200) {
    return FatalException(
      0xf0000 | req.status,
      `failed to GET resource; is the server online?`
    );
  }

  const data = await req.text();
  try {
    LogStep(`writing ${Paint(filepath, Colors.cyan)}`);
    await writeFile(filepath, data, { encoding: "utf8", mode });
    return LogSuccess(
      `wrote ${Paint(filepath, Colors.cyan)} with mode ${Paint(
        `0${mode.toString(8)}`,
        Colors.bold
      )}`
    );
  } catch (_error) {
    return FatalException(100, "cannot write file; do you have permission?");
  }
}
