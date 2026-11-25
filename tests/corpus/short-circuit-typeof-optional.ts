type FieldValue = bigint | boolean | number | { x: number; y: number; z: number } | string | undefined;

function read(value: FieldValue): FieldValue {
  return value;
}

function selected(value: FieldValue): boolean {
  const bits = read(value);
  return typeof bits === "bigint" && (bits & 1n) !== 0n;
}

function fallback(value: FieldValue): boolean {
  const bits = read(value);
  return typeof bits !== "bigint" || (bits & 1n) === 0n;
}

console.log(selected(3n), selected(2n), selected(undefined), selected("x"));
console.log(fallback(3n), fallback(2n), fallback(undefined), fallback("x"));
