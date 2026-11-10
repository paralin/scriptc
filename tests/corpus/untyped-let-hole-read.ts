// A `let c;` without a type takes its flow types from what the code assigns,
// and the checker types an element read as present even at a hole of a
// sparse table or past the end. A read of the binding keeps the actual value,
// as protobuf-es-lite's base64 decoder relies on for '=' padding.

const table: number[] = [];
for (let i = 0; i < 26; i++) table[65 + i] = i;

function decode(s: string): number[] {
  const out: number[] = [];
  let b,
    seen = 0;
  for (let i = 0; i < s.length; i++) {
    b = table[s.charCodeAt(i)];
    if (b === undefined) {
      seen++;
      continue;
    }
    out.push(b * 2);
  }
  out.push(seen);
  return out;
}
console.log(decode("ABC="));
console.log(decode("A B=="));

let late;
late = 1;
late = table[200];
console.log(late === undefined, typeof late);

var held;
held = table[66];
console.log(held + 1);

function count(xs: number[]): number {
  let n = 0,
    x;
  for (let i = 0; i <= xs.length; i++) {
    x = xs[i];
    if (x !== undefined) n += x;
  }
  return n;
}
console.log(count([1, 2, 3]));
