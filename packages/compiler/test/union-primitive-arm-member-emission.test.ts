// Stable guards project the present record inside the optional chain.
// Repeated getters retain their declared scalar arms and their JS member answers.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { compile, deserializeModule, validateModule } from "../src/index.js";

import type { IrExpr, IrModule } from "../src/ir/ir.js";
import { everyExpr, everyStmtList } from "../src/ir/traverse.js";

const PRELUDE = [
  "interface Part { image_url?: string | { url?: string } }",
  "type Negotiation = { parsed: number; sequence: string } | 'pending' | undefined;",
];

async function compileToIr(
  body: string[],
): Promise<{ ok: boolean; module: IrModule | null; diagnostics: string }> {
  const dir = await mkdtemp(join(tmpdir(), "scriptc-union-primitive-arm-"));
  try {
    const entry = join(dir, "main.ts");
    const outPath = join(dir, "main.ir.json");
    await writeFile(entry, [...PRELUDE, ...body].join("\n"));
    const result = await compile(entry, { outDir: dir, outPath, outputKind: "ir" });
    if (!result.ok)
      return {
        ok: false,
        module: null,
        diagnostics: result.diagnostics.map((d) => `${d.code}: ${d.message}`).join("\n"),
      };
    const module = deserializeModule(await readFile(outPath, "utf8"));
    expect(validateModule(module)).toEqual([]);
    return { ok: true, module, diagnostics: "" };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function expressions(module: IrModule, root: string): IrExpr[] {
  const expressions: IrExpr[] = [];
  for (const fn of module.functions) {
    if (!fn.name.startsWith(root)) continue;
    everyStmtList(fn.body, {
      expr: (expr) => {
        expressions.push(expr);
        return true;
      },
      stmt: () => true,
    });
  }
  return expressions;
}

function guardedRecordRead(module: IrModule, root: string, field: string): void {
  // Keep the stored union on the absence test, including its scalar arm.
  const nodes = expressions(module, root);
  const chain = nodes.find((node) => node.kind === "optChain");
  expect(chain?.kind).toBe("optChain");
  if (chain?.kind !== "optChain") return;
  expect(chain.receiver.type.kind).toBe("union");
  if (chain.receiver.type.kind !== "union") return;
  const receiverId = chain.receiver.type.unionId;
  const receiver = module.unions?.find((union) => union.id === receiverId);
  expect(receiver?.arms.map((arm) => arm.kind)).toEqual(
    expect.arrayContaining(["record", "string", "undefinedT"]),
  );

  // Project only the guarded chain receiver before reading the record field.
  expect(nodes.some((node) => node.kind === "unionKeyGet")).toBe(false);
  const guarded: IrExpr[] = [];
  everyExpr(chain.body, {
    expr: (expr) => {
      guarded.push(expr);
      return true;
    },
    stmt: () => true,
  });
  const read = guarded.find((node) => node.kind === "recordGet" && node.field === field);
  expect(read?.kind).toBe("recordGet");
  if (read?.kind !== "recordGet") return;
  expect(read.obj.kind).toBe("call");
  if (read.obj.kind !== "call") return;
  expect(read.obj.callee).toMatch(/^%union\.narrow\./);
  expect(guarded).toContainEqual(
    expect.objectContaining({
      kind: "chainRecv",
      id: chain.id,
      type: chain.receiver.type,
    }),
  );
}

test("a stable string guard projects the present record inside the chain", async () => {
  const compiled = await compileToIr([
    "function pick(part: Part): string | undefined {",
    "  return typeof part.image_url === 'string' ? part.image_url : part.image_url?.url;",
    "}",
    "console.log(pick({ image_url: 'a' }), pick({ image_url: { url: 'b' } }), pick({}));",
  ]);
  expect(compiled.ok, compiled.diagnostics).toBe(true);
  guardedRecordRead(compiled.module!, "pick", "url");
});

test("a stable literal guard projects the present record inside the chain", async () => {
  const compiled = await compileToIr([
    "function read(n: Negotiation): string {",
    "  if (n === 'pending') return 'pending';",
    "  return n?.sequence ?? '';",
    "}",
    "console.log(read('pending'), read({ parsed: 1, sequence: 's' }), read(undefined));",
  ]);
  expect(compiled.ok, compiled.diagnostics).toBe(true);
  guardedRecordRead(compiled.module!, "read", "sequence");
});

test("a primitive member keeps its own answer, not undefined", async () => {
  // `.length` IS a string member: the read must not be rewritten into the
  // unimplemented-answer path just because a string arm is stored.
  const compiled = await compileToIr([
    "type Sized = { length: number } | string;",
    "function size(s: Sized): number {",
    "  return typeof s === 'string' ? s.length : s.length;",
    "}",
    "console.log(size('abc'), size({ length: 3 }));",
  ]);
  expect(compiled.ok, compiled.diagnostics).toBe(true);
  // Its lowering reads each arm's own `length`; no undefined answer joins in.
  expect(
    expressions(compiled.module!, "size").some((node) => node.type.kind === "undefinedT"),
  ).toBe(false);
});

test("a repeated getter keeps a scalar arm that a prior read excluded", async () => {
  const compiled = await compileToIr([
    "class ChangingPart {",
    "  reads = 0;",
    "  get image_url(): string | { url?: string } | undefined {",
    "    return ++this.reads === 1 ? { url: 'record' } : 'string';",
    "  }",
    "}",
    "function pickChanging(part: ChangingPart): string | undefined {",
    "  return typeof part.image_url === 'string' ? part.image_url : part.image_url?.url;",
    "}",
    "const part = new ChangingPart(); console.log(pickChanging(part), part.reads);",
  ]);
  expect(compiled.ok, compiled.diagnostics).toBe(true);
  expect(
    expressions(compiled.module!, "pickChanging").some((node) => node.kind === "unionKeyGet"),
  ).toBe(true);
});
