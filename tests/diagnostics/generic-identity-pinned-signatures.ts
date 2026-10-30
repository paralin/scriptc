// Two VALUES pinned from one generic declaration at different signatures
// compare by identity: JavaScript has one function object, the compiled
// program has one closure per signature, so the comparison is refused
// instead of answering `false`.
function ident<T>(x: T): T {
  return x;
}
const num: (x: number) => number = ident;
const anyPin: (x: any) => any = ident;
const i = ident<number>;
const j = ident<any>;
console.log(num === anyPin);
console.log(i === j);
