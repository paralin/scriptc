/* An object literal carrying an asserted type whose union-valued member
 * holds an arm the asserted target excludes converts the member in a
 * CHECKED context: the excluded arm throws the catchable TypeError the
 * lying-assertion stance promises (divergence 38), where the copy rules
 * would refuse the literal. Node erases the assertion, so this divergence is
 * not a corpus case; the conforming shape is pinned by tests/corpus/
 * 8623-union-asserted-literal-retag.ts. */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { compile } from "../src/index.js";

async function run(source: string): Promise<ReturnType<typeof spawnSync>> {
  const dir = mkdtempSync(join(tmpdir(), "scriptc-asserted-checks-"));
  try {
    const entry = join(dir, "main.ts");
    writeFileSync(entry, source);
    const built = await compile(entry, {
      outDir: dir,
      outPath: join(dir, "program"),
      sanitize: process.env["SCRIPTC_SAN"] === "1",
    });
    if (!built.ok) throw new Error(built.diagnostics.map((d) => d.message).join("\n"));
    return spawnSync(built.binaryPath, [], { timeout: 30_000 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// An object literal carrying an asserted type whose union-valued member
// holds an arm the asserted target excludes: the excluded arm throws a
// TypeError the program can catch instead of refusing the literal.
test.skipIf(process.platform === "win32")(
  "an asserted object literal traps on a union member arm the target excludes",
  async () => {
    const result = await run(`
type ToolArgs = { arguments: unknown; id: string; name: string; type: string };
type Text = { text: string; type: string };
type Mime = { data: string; type: string };
type Content = ToolArgs[] | (Mime | Text)[];
type Message = { content: (Mime | Text)[] };
type Replacement = { content: Content };
function rebuilt(message: Message, replacement: Replacement): Message {
  return { ...message, content: replacement.content } as Message;
}
const text: Text = { type: "text", text: "hi" };
const tool: ToolArgs = { arguments: {}, id: "1", name: "bash", type: "tool" };
console.log(JSON.stringify(rebuilt({ content: [] }, { content: [text] })));
try {
  rebuilt({ content: [] }, { content: [tool] });
  console.log("unreachable");
} catch (err) {
  console.log("threw", (err as Error).name);
}
console.log("survived");
`);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout.toString()).toBe(
      '{"content":[{"type":"text","text":"hi"}]}\nthrew TypeError\nsurvived\n',
    );
  },
);
