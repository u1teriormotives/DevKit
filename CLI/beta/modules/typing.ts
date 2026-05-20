/** @format */
// deno-lint-ignore-file no-namespace

import { Resolution as res } from "./resolution.ts";

export type CLIData = {
  name: Readonly<string>;
  version:
    | `v${number}.${number}.${number}`
    | `v${number}.${number}.${number}-beta`;
};
export type Timeperiod = string;
export type Version =
  | `v${number}.${number}.${number}`
  | `v${number}.${number}.${number}-beta`;

export namespace DK {
  export namespace Commands {
    export interface Command {
      readonly commandName: string;
      readonly aliases: string[] | undefined | null;
      readonly description: string | undefined | null;
      readonly flags: Map<string, FlagType> | FlagType[] | undefined | null;
      readonly subcommands: Set<string> | string[] | undefined | null;
      readonly commandFunction: (
        subcommands: Set<string>,
        flags: Map<string, Flag>
      ) => Promise<void>;
    }

    export type Flag = {
      readonly name: string;
      readonly value: string | null;
    };
    export type FlagType = {
      readonly name: string;
      readonly optional: boolean;
      readonly description: string | undefined;
    };
  }

  export const Resolution = res;

  export enum FileMode {
    RWE = 0o755,
    RW = 0o644,
  }
}
