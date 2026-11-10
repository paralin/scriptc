// A call on the result of `??=` reaches the present arm's methods: the
// result is never nullish, whether the slot kept its value or took the
// right side.
interface State {
  used?: Set<number>
  names?: Map<string, number>
  list?: number[]
}

const state: State = {}
;(state.used ??= new Set()).add(3)
;(state.used ??= new Set()).add(4)
;(state.used ??= new Set([99])).add(3)
console.log(state.used.size, [...state.used].join(","))

;(state.names ??= new Map()).set("a", 1)
console.log((state.names ??= new Map()).get("a"), state.names.size)

console.log((state.list ??= [1, 2]).length)
;(state.list ??= []).push(3)
console.log(state.list.join(","))

let calls = 0
function fresh(): Set<number> {
  calls++
  return new Set()
}
const other: State = {}
;(other.used ??= fresh()).add(1)
;(other.used ??= fresh()).add(2)
console.log(calls, other.used.size)

let local: Set<string> | undefined
;(local ??= new Set()).add("x")
console.log((local ??= new Set()).has("x"))
