// `??=` whose right side is a narrowed union: the slot holds one record arm
// or null, and the value is any of the narrowed arms, so it converts as it
// would in a plain assignment.
type Bound =
  | { kind: "set"; values: string[] }
  | { kind: "partial"; values: string[]; at: number; why: string }
  | { kind: "top"; at: number; why: string }

function union(bounds: readonly Bound[]): string {
  let residual: { at: number; why: string } | null = null
  const values: string[] = []
  for (const b of bounds) {
    if (b.kind !== "set") {
      residual ??= b
      if (b.kind === "top") continue
    }
    values.push(...b.values)
  }
  if (residual === null) return values.join(",")
  return residual.why + "@" + residual.at + ":" + values.join(",")
}

console.log(union([{ kind: "set", values: ["a"] }]))
console.log(union([
  { kind: "set", values: ["a"] },
  { kind: "partial", values: ["b"], at: 2, why: "p" },
  { kind: "top", at: 3, why: "t" },
]))
console.log(union([{ kind: "top", at: 1, why: "t" }, { kind: "partial", values: ["c"], at: 2, why: "p" }]))
