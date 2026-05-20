/** @format */

import * as Functions from "../modules/functions.ts";
import { DK } from "../modules/typing.ts";

const FetchCommand: DK.Commands.Command = {
  commandName: "fetch",
  description: "Fetch a module from the DevKit project",
  aliases: undefined,
  flags: [
    { name: "--path", description: "the path of the module", optional: true },
  ],
  subcommands: ["route <js/c#>"],
  commandFunction: async function (
    subcommands: Set<string>,
    flags: Map<string, DK.Commands.Flag>
  ): Promise<void> {
    const sbcmds: string[] = [...subcommands.values()];

    const PrimaryArgument: string = sbcmds[0];
    if (PrimaryArgument) {
      switch (PrimaryArgument) {
        case "route": {
          const SecondaryArgument: string = sbcmds[1];
          switch (SecondaryArgument) {
            case "js":
            case "javascript": {
              const Endpoint: Readonly<string> =
                DK.Resolution.resolveEndpoint("route-js");
              let path = "./route";
              if (flags.has("--path"))
                path = flags.get("--path")?.value ?? "./route";

              await Functions.FetchEndpoint(
                Endpoint,
                path,
                undefined,
                DK.FileMode.RWE
              );
              break;
            }
            case "c#":
              Functions.FatalException(101, "not implemented");
              break;
            default:
              Functions.FatalException(100, "invalid subcommand");
              break;
          }
          break;
        }
        default:
          Functions.FatalException(100, "invalid subcommand");
      }
    }
  },
};

export default FetchCommand;
