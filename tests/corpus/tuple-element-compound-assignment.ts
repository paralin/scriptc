// Compound assignment and update of a tuple's element through a numeric
// literal index.
const into: [number, number, number] = [1, 2, 3]
into[0] += 1
into[2] *= 5
into[1]++
--into[1]
console.log(into.join(","))

const used = (into[1] -= 10)
const before = into[0]++
console.log(used, before, into.join(","))

const pair: [string, number] = ["a", 1]
pair[0] += "b"
pair[1] **= 3
pair[1] |= 4
console.log(pair[0], pair[1])

let reads = 0
const held: [number, number] = [10, 20]
function tuple(): [number, number] {
  reads++
  return held
}
tuple()[1] -= 5
console.log(reads, held.join(","))
