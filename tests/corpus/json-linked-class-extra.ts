class Extra {
  readonly value = 7;
}
let calls = 0;
function narrow(value: { name: string }): { name: string } {
  calls++;
  return value;
}
const source = { name: "x", extra: new Extra() };
console.log(JSON.stringify(narrow(source)));

class Omitted {
  toJSON(): undefined {
    return undefined;
  }
}
const omitted = { name: "omitted", extra: new Omitted() };
console.log(JSON.stringify(narrow(omitted)));

class Circular {
  self: Circular | undefined;
}
const cycle = new Circular();
cycle.self = cycle;
try {
  const circular = { name: "cycle", extra: cycle };
  console.log(JSON.stringify(narrow(circular)));
} catch (error) {
  console.log(error instanceof TypeError);
}

class Mutator {
  toJSON(key: string): string {
    mutating.later = 2;
    return key;
  }
}
const mutating = { name: "mutation", extra: new Mutator(), later: 1 };
console.log(JSON.stringify(narrow(mutating)));

const root = {
  name: "root",
  toJSON(): undefined {
    return undefined;
  },
};
const missing = JSON.stringify(narrow(root));
console.log(typeof missing, missing === undefined);
console.log("calls", calls);
