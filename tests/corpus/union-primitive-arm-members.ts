// Stable guards can project a record arm. A repeated getter can instead
// return a scalar arm, whose missing record member must answer undefined.

type Negotiation = { parsed: number; sequence: string } | "pending" | undefined;

interface MessagePart {
  image_url?: string | { url?: string };
}

function pickUrl(part: MessagePart): string {
  const url =
    typeof part.image_url === "string" ? part.image_url : part.image_url?.url;
  return url === undefined ? "<none>" : url;
}

function sequenceOf(n: Negotiation): string {
  if (typeof n === "string") return `pending-literal ${n}`;
  const s = n?.sequence;
  return s === undefined ? "<absent>" : `${n?.parsed}:${s}`;
}

console.log(pickUrl({ image_url: "data:text/plain;base64,AA==" }));
console.log(pickUrl({ image_url: { url: "https://example.test/a.png" } }));
console.log(pickUrl({ image_url: {} }));
console.log(pickUrl({}));

console.log(sequenceOf({ parsed: 3, sequence: "kitty" }));
console.log(sequenceOf("pending"));
console.log(sequenceOf(undefined));

// The same stable guard must preserve the record's numeric field and
// the optional chain's absent answer.
function parsedOrNone(n: Negotiation): number | undefined {
  if (typeof n === "string") return undefined;
  return n?.parsed;
}

console.log(parsedOrNone("pending"));
console.log(parsedOrNone({ parsed: 2, sequence: "x" }));
console.log(parsedOrNone(undefined));

// A plain member read after a number guard keeps the record's value.
type Counted = { total: number } | number;

function totalOrUndefined(c: Counted): number | undefined {
  if (typeof c === "number") return undefined;
  return c.total;
}

console.log(totalOrUndefined({ total: 9 }));
console.log(totalOrUndefined(42));

// Getter reads are distinct: the first narrows to a record, but the second
// returns a string. The optional member read must not reuse the old proof.
class ChangingPart {
  reads = 0;
  get image_url(): string | { url?: string } | undefined {
    return ++this.reads === 1 ? { url: "record" } : "string";
  }
}

function pickChanging(part: ChangingPart): string | undefined {
  return typeof part.image_url === "string" ? part.image_url : part.image_url?.url;
}

const changing = new ChangingPart();
console.log(pickChanging(changing), changing.reads);
