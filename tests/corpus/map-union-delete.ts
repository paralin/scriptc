// has() and delete() on a union of Maps that share a key type, as the
// element of an array of differently valued Maps.
class Slots {
  prepared = new Map<number, string>()
  asked = new Map<number, number>()

  drop(slot: number): boolean[] {
    const out: boolean[] = []
    for (const slots of [this.prepared, this.asked]) out.push(slots.delete(slot))
    return out
  }

  holds(slot: number): boolean[] {
    return [this.prepared, this.asked].map((slots) => slots.has(slot))
  }
}

const s = new Slots()
s.prepared.set(1, "a")
s.asked.set(1, 2)
s.asked.set(2, 3)
console.log(s.holds(1).join(","), s.holds(2).join(","))
console.log(s.drop(1).join(","), s.drop(1).join(","))
console.log(s.prepared.size, s.asked.size)

let picks = 0
function pick(): Map<number, string> | Map<number, number> {
  picks++
  return picks % 2 === 1 ? s.prepared : s.asked
}
let keys = 0
function key(): number {
  keys++
  return 2
}
console.log(pick().has(key()), pick().delete(key()), picks, keys, s.asked.size)
