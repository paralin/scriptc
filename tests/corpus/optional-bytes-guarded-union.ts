function input(value: Uint8Array | string | undefined): Uint8Array | string | undefined {
  return value;
}

function size(value: Uint8Array | string | undefined): number {
  const text = input(value);
  return typeof text === "string" ? text.length : (text?.length ?? 0);
}

let reads = 0;
function counted(value: Uint8Array | undefined): Uint8Array | undefined {
  reads++;
  return value;
}

function bytesAfterGuard(value: Uint8Array | string | undefined): number {
  if (typeof value === "string") return value.length;
  return counted(value)?.byteLength ?? 0;
}

console.log(size("abc"), size(new Uint8Array([1, 2])), size(undefined));
console.log(bytesAfterGuard(new Uint8Array([1, 2, 3])), bytesAfterGuard(undefined), reads);
