/** @format */

import process from "node:process";

import CLIData from "./modules/configuration.ts";
import * as DKFunctions from "./modules/functions.ts";
import * as DevKit from "./modules/typing.ts";

import FetchCommand from "./commands/fetch.ts";
import MakeCommand from "./commands/make.ts";

const Commands: string[] = [];
const cmds: Map<string, DevKit.DK.Commands.Command> = new Map();
const Flags: Map<string, DevKit.DK.Commands.Flag> = new Map();

const Style = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

function Paint(text: string, ...styles: string[]): string {
  return `${styles.join("")}${text}${Style.reset}`;
}

function StripAnsi(text: string): string {
  let stripped = "";
  let inEscape = false;

  for (const char of text) {
    if (char === "\x1b") {
      inEscape = true;
      continue;
    }

    if (inEscape) {
      if (char === "m") inEscape = false;
      continue;
    }

    stripped += char;
  }

  return stripped;
}

function PadAnsi(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - StripAnsi(text).length));
}

function Rule(title?: string): void {
  const line = "-".repeat(54);
  if (!title) {
    console.log(Paint(line, Style.dim));
    return;
  }

  console.log(
    `${Paint("--", Style.dim)} ${Paint(title, Style.bold, Style.cyan)} ${Paint(
      "-".repeat(Math.max(2, 50 - title.length)),
      Style.dim
    )}`
  );
}

function Section(title: string): void {
  console.log();
  console.log(Paint(title.toUpperCase(), Style.bold, Style.blue));
}

function Row(label: string, description?: string | null, accent = Style.green) {
  const name = Paint(label, Style.bold, accent);
  const detail = description ? `${Paint(" - ", Style.dim)}${description}` : "";
  console.log(`  ${PadAnsi(name, 22)}${detail}`);
}

cmds.set("fetch", FetchCommand);
cmds.set("make", MakeCommand);

if (process.argv.length < 2) DKFunctions.FatalException(202, "few arguments");
const args: readonly string[] = process.argv.slice(2);

for (let i = 0; i < args.length; i++) {
  const argument = args[i].trim().toWellFormed();

  if (argument.startsWith("-")) {
    const [flag, value] = argument.split("=", 2);
    Flags.set(flag, { name: flag.replaceAll("-", ""), value });
    continue;
  }

  Commands.push(argument);
}

const PrimaryArgument: string | null = Commands[0] || null;
const HasHelpFlag: boolean = Flags.has("-h") || Flags.has("--help");
const Help: boolean = PrimaryArgument
  ? PrimaryArgument === "help" || HasHelpFlag
  : HasHelpFlag;

function PrintHeader() {
  Rule();
  console.log(
    `${Paint(CLIData.name, Style.bold, Style.magenta)} ${Paint(
      CLIData.version,
      Style.dim
    )} ${Paint("DevKit package manager", Style.cyan)}`
  );
  Rule();
}
function PrintFlag(flag: DevKit.DK.Commands.FlagType) {
  const wrapper = flag.optional ? ["[", "]"] : ["<", ">"];
  const text = `${wrapper[0]}${flag.name}${wrapper[1]}`;

  Row(text, flag.description, flag.optional ? Style.yellow : Style.green);
}
function PrintFlags(
  flags:
    | Map<string, DevKit.DK.Commands.FlagType>
    | DevKit.DK.Commands.FlagType[]
) {
  const list = flags instanceof Map ? [...flags.values()] : flags;
  if (!list.length) return;

  Section("Flags");
  for (const flag of list) {
    PrintFlag(flag);
  }
}
function PrintCommandHelp(cmd: DevKit.DK.Commands.Command) {
  PrintHeader();

  Section("Usage");
  console.log(
    `  ${Paint(process.argv0, Style.dim)} ${Paint(
      cmd.commandName,
      Style.bold,
      Style.green
    )} ${Paint("[subcommand] [flags]", Style.dim)}`
  );
  console.log(`  ${cmd.description ?? "No description."}`);

  if (cmd.aliases?.length) {
    Section("Aliases");
    console.log(
      `  ${cmd.aliases.map(alias => Paint(alias, Style.cyan)).join(", ")}`
    );
  }

  if (cmd.subcommands) {
    const subcommands = Array.isArray(cmd.subcommands)
      ? cmd.subcommands
      : [...cmd.subcommands];

    if (subcommands.length > 0) {
      Section("Subcommands");
      for (const subcmd of subcommands) {
        Row(subcmd, null, Style.cyan);
      }
    }
  }

  if (cmd.flags) {
    PrintFlags(cmd.flags);
  }
}
function PrintHelp(): void {
  PrintHeader();

  Section("Usage");
  console.log(
    `  ${Paint(process.argv0, Style.dim)} ${Paint(
      "<command>",
      Style.bold,
      Style.green
    )} ${Paint("[flags]", Style.dim)}`
  );

  Section("Commands");
  Row("help", "show global help or details for a command", Style.cyan);

  const commands: DevKit.DK.Commands.Command[] = [...cmds.values()];
  for (const cmd of commands) {
    Row(cmd.commandName, cmd.description, Style.green);
  }

  Section("Examples");
  console.log(`  ${Paint(`${process.argv0} help make`, Style.dim)}`);
  console.log(
    `  ${Paint(`${process.argv0} fetch route js --path=./route`, Style.dim)}`
  );
}

if (Help) {
  if (PrimaryArgument === "help") {
    const HArgument = Commands[1] ?? null;

    if (HArgument) {
      const cmd = cmds.get(HArgument);
      if (!cmd) DKFunctions.FatalException(201, "invalid command");

      PrintCommandHelp(cmd as DevKit.DK.Commands.Command);
      process.exit(0);
    }

    PrintHelp();
    process.exit(0);
  }

  if (PrimaryArgument) {
    const cmd = cmds.get(PrimaryArgument);
    if (!cmd) DKFunctions.FatalException(201, "invalid command");

    PrintCommandHelp(cmd as DevKit.DK.Commands.Command);
    process.exit(0);
  }

  PrintHelp();
  process.exit(0);
}
if (!PrimaryArgument && (Flags.has("-v") || Flags.has("--version"))) {
  PrintHeader();
  process.exit(0);
}

if (PrimaryArgument && cmds.has(PrimaryArgument)) {
  const cmd = cmds.get(PrimaryArgument);
  await cmd?.commandFunction(new Set(Commands.slice(1)), Flags);
} else {
  PrintHelp();
  DKFunctions.FatalException(201, "invalid command");
}
