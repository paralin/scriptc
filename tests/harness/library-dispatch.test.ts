// @requires-wasi-runtime-pack: needs @scriptc/runtime-wasm32-wasi/runtime-pack.json.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { WASI } from "node:wasi";
import { expect, test } from "vitest";
import { compileLibrary } from "@scriptc/compiler";

const fixture = join(import.meta.dirname, "../library-mode/wasm/dispatch.mjs");
const modes = ["native", "sanitized", "wasm-dev"] as const;
// Built by the wasm artifacts job; the fast tier has no wasm32-wasi pack.
const wasmPack = join(import.meta.dirname, "../../packages/runtime-wasm32-wasi/runtime-pack.json");

test.for(modes)(
  "synchronous checked dispatch in a %s library matches Node",
  async (mode, context) => {
    if (
      mode === "wasm-dev"
        ? spawnSync("zig", ["version"]).status !== 0 || !existsSync(wasmPack)
        : process.platform !== "darwin" && process.platform !== "linux"
    )
      context.skip();
    const directory = await mkdtemp("/tmp/scriptc-library-dispatch-");
    const oldTarget = process.env["SCRIPTC_TARGET"];
    try {
      if (mode === "wasm-dev") process.env["SCRIPTC_TARGET"] = "wasm32-wasi";
      else delete process.env["SCRIPTC_TARGET"];
      const profilePath = join(directory, "profile.json");
      await writeFile(
        profilePath,
        JSON.stringify({
          profile_format: 1,
          name: "sync-dispatch",
          entry: fixture,
          emission: "llvm",
          optimization: mode === "wasm-dev" ? "dev" : "release",
          abi: { prefix: "app_", init_symbol: "app_init", sink_register_symbol: "app_sink" },
          exports: ["dispatch", "initCodecs", "codecStep"].map((name) => ({
            export: name,
            symbol: `app_${name}`,
            params: [],
            returns: "f64",
          })),
        }),
      );
      const result = await compileLibrary({
        profilePath,
        outDir: directory,
        sanitize: mode === "sanitized",
      });
      if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
      const llvm = await readFile(result.llvmPath, "utf8");
      for (const name of [
        "scr_text_decoder_to_dyn",
        "scr_text_encoder_to_dyn",
        "scr_text_codec_from_dyn",
      ])
        expect(llvm).toContain(`call ptr @${name}(`);
      const reference = spawnSync(
        process.execPath,
        [
          "--no-warnings",
          "--input-type=module",
          "-e",
          `import {dispatch, initCodecs, codecStep} from ${JSON.stringify(fixture)};
           console.log(dispatch()); console.log(initCodecs()); console.log(codecStep()); console.log(codecStep());`,
        ],
        { encoding: "utf8" },
      );
      let actual: { stdout: string; stderr: string; status: number | null };
      if (mode === "wasm-dev") {
        const exports = await wasmLibrary(result.archivePath);
        (exports.app_init as Function)();
        actual = {
          stdout:
            ["app_dispatch", "app_initCodecs", "app_codecStep", "app_codecStep"]
              .map((name) => (exports[name] as Function)())
              .join("\n") + "\n",
          stderr: "",
          status: 0,
        };

        // A generator's frame survives the result arena's reset on each
        // exported call; completion and explicit return run finally once.
        const generator = join(directory, "generator.ts");
        await writeFile(
          generator,
          `
          let starts = 0, finishes = 0;
          function* steps(): Generator<number, number, unknown> {
            starts++;
            try { yield 1; yield* [2]; return 3; }
            finally { finishes++; }
          }
          const work = steps();
          export function step(): number {
            const result = work.next();
            return (result.value ?? 0) + 100 * finishes;
          }
          export function cancel(): number {
            const before = starts;
            const unopened = steps();
            void unopened;
            const iterator = steps();
            iterator.next();
            const result = iterator.return(9);
            return starts === before + 1 && finishes === 2 && result.done && result.value === 9 ? 1 : 0;
          }
        `,
        );
        await writeFile(
          profilePath,
          JSON.stringify({
            profile_format: 1,
            name: "sync-generator",
            entry: generator,
            emission: "llvm",
            abi: { prefix: "app_", init_symbol: "app_init", sink_register_symbol: "app_sink" },
            exports: ["step", "cancel"].map((name) => ({
              export: name,
              symbol: `app_${name}`,
              params: [],
              returns: "f64",
            })),
          }),
        );
        const built = await compileLibrary({ profilePath, outDir: join(directory, "generator") });
        if (!built.ok) throw new Error(JSON.stringify(built.diagnostics));
        const resumed = await wasmLibrary(built.archivePath);
        (resumed.app_init as Function)();
        expect(Array.from({ length: 4 }, () => (resumed.app_step as Function)())).toEqual([
          1, 2, 103, 100,
        ]);
        expect((resumed.app_cancel as Function)()).toBe(1);
      } else {
        const probe = join(directory, "probe.c"),
          binary = join(directory, "probe");
        await writeFile(
          probe,
          '#include <stdio.h>\nvoid app_init(void); double app_dispatch(void); double app_initCodecs(void); double app_codecStep(void);\nint main(void) { app_init(); printf("%.0f\\n", app_dispatch()); printf("%.0f\\n", app_initCodecs()); printf("%.0f\\n", app_codecStep()); printf("%.0f\\n", app_codecStep()); app_init(); return 0; }\n',
        );
        const link = spawnSync(
          "clang",
          [
            probe,
            result.archivePath,
            "-lm",
            ...(mode === "sanitized" ? ["-fsanitize=address"] : []),
            "-o",
            binary,
          ],
          { encoding: "utf8" },
        );
        expect(link.status, link.stderr).toBe(0);
        actual = spawnSync(binary, [], { encoding: "utf8" });
      }
      expect({ stdout: actual.stdout, stderr: actual.stderr, status: actual.status }).toEqual({
        stdout: reference.stdout,
        stderr: reference.stderr,
        status: reference.status,
      });
    } finally {
      if (oldTarget === undefined) delete process.env["SCRIPTC_TARGET"];
      else process.env["SCRIPTC_TARGET"] = oldTarget;
      await rm(directory, { recursive: true, force: true });
    }
  },
);

/** wasmLibrary initializes a reactor with the real WASI imports and a panic sink. */
async function wasmLibrary(path: string): Promise<WebAssembly.Exports> {
  const wasi = new WASI({ version: "preview1" });
  const instance = new WebAssembly.Instance(new WebAssembly.Module(await readFile(path)), {
    ...wasi.getImportObject(),
    scriptc: {
      panic() {
        throw new Error("unexpected panic");
      },
    },
  });
  wasi.initialize(instance);
  return instance.exports;
}
