/** @format */

import { spawn } from "node:child_process";

import * as Functions from "../modules/functions.ts";
import { DK } from "../modules/typing.ts";

const MakeCommand: DK.Commands.Command = {
  commandName: "make",
  description: "Make a file from the DevKit project",
  aliases: undefined,
  flags: [
    { name: "--path", description: "the path of the file", optional: true },
  ],
  subcommands: [
    "apikey/keygen",
    "dkroute",
    "index.html",
    "clang-format",
    "prettierrc",
  ],
  commandFunction: async function (
    subcommands: Set<string>,
    flags: Map<string, DK.Commands.Flag>
  ): Promise<void> {
    const sbcmds: string[] = [...subcommands.values()];

    const PrimaryArgument: string = sbcmds[0];

    if (PrimaryArgument) {
      const Endpoint: Readonly<string> =
        DK.Resolution.resolveEndpoint(PrimaryArgument);
      switch (PrimaryArgument) {
        case "apikey":
        case "keygen": {
          let path = "./keygen.c";
          if (flags.has("--path")) {
            path = flags.get("--path")?.value ?? "./keygen.c";
          }

          await Functions.FetchEndpoint(
            Endpoint,
            path,
            undefined,
            DK.FileMode.RW
          );

          Functions.LogStep("spawning gcc");
          const compile = spawn("gcc", [path, "-o", "APIKeyGenerator"]);
          compile.stdout.on("data", msg => Functions.LogStep(`gcc: ${msg}`));
          compile.stderr.on("data", msg => Functions.LogError(`gcc: ${msg}`));

          compile.on("close", () =>
            Functions.LogSuccess("compiled binary to ./APIKeyGenerator")
          );
          break;
        }
        case "dkroute": {
          let path = "./DKRoute";
          if (flags.has("--path")) {
            path = flags.get("--path")?.value ?? "./DKRoute";
          }

          await Functions.FetchEndpoint(
            Endpoint,
            path,
            undefined,
            DK.FileMode.RW
          );
          break;
        }
        case "index.html": {
          let path = "./index.html";
          if (flags.has("--path")) {
            path = flags.get("--path")?.value ?? "./index.html";
          }

          await Functions.FetchEndpoint(
            Endpoint,
            path,
            undefined,
            DK.FileMode.RW
          );
          break;
        }
        case "clang-format": {
          let path = "./.clang-format";
          if (flags.has("--path")) {
            path = flags.get("--path")?.value ?? "./.clang-format";
          }

          await Functions.FetchEndpoint(
            Endpoint,
            path,
            undefined,
            DK.FileMode.RW
          );
          break;
        }
        case "prettierrc": {
          let path = "./.prettierrc";
          if (flags.has("--path")) {
            path = flags.get("--path")?.value ?? "./.prettierrc";
          }

          await Functions.FetchEndpoint(
            Endpoint,
            path,
            undefined,
            DK.FileMode.RW
          );
          break;
        }
        default:
          Functions.FatalException(100, "invalid subcommand");
          break;
      }
    }
  },
};

export default MakeCommand;
