import { describe, expect, test } from "vitest";
import { BOOL, DYN, type IrExpr, type IrType, type SrcLoc } from "../../ir/ir.js";
import { lowerBytesIntegrity } from "./lower-calls.js";
import type { Lowerer } from "./lowerer.js";

const loc: SrcLoc = { file: "bytes.js", start: 0, end: 1 };
const bytes: IrType = { kind: "bytes", elem: "i8" };

/** The conversions the helper needs: a value boxes into dyn (dynFrom) and a
 * dyn value converts back to a typed slot through its checked cast. */
function stub(): Lowerer {
  return {
    coerceToExpected: (expr: IrExpr, expected: IrType): IrExpr =>
      expected.kind === "dyn"
        ? { kind: "dynFrom", value: expr, type: DYN, loc: expr.loc }
        : { kind: "dynCheck", value: expr, type: expected, loc: expr.loc },
  } as unknown as Lowerer;
}

const view: IrExpr = { kind: "varRef", localId: "s.0", type: bytes, loc };

describe("lowerBytesIntegrity", () => {
  test("seal boxes the view, seals it dynamically and answers the same view", () => {
    const result = lowerBytesIntegrity(stub(), "dyn.seal", view, loc);
    // A typed result: the checked cast of the same view (identity preserved).
    expect(result.kind).toBe("dynCheck");
    expect(result.type).toEqual(bytes);
    const call = result.kind === "dynCheck" ? result.value : null;
    expect(call?.kind).toBe("libCall");
    expect(call?.kind === "libCall" ? call.fn : null).toBe("dyn.seal");
    expect(call?.kind === "libCall" ? call.type : null).toEqual(DYN);
    const arg = call?.kind === "libCall" ? call.args[0] : null;
    expect(arg?.kind).toBe("dynFrom");
    expect(arg?.kind === "dynFrom" ? arg.value : null).toEqual(view);
  });

  test("freeze of a DataView (bytes<u8>) answers the view", () => {
    const dv: IrExpr = { kind: "varRef", localId: "s.1", type: { kind: "bytes", elem: "u8" }, loc };
    const result = lowerBytesIntegrity(stub(), "dyn.freeze", dv, loc);
    expect(result.kind).toBe("dynCheck");
  });

  test("a query answers a boolean and keeps no view result", () => {
    const result = lowerBytesIntegrity(stub(), "dyn.isSealed", view, loc);
    expect(result.kind).toBe("libCall");
    expect(result.type).toEqual(BOOL);
    expect(result.kind === "libCall" ? result.fn : null).toBe("dyn.isSealed");
  });
});
