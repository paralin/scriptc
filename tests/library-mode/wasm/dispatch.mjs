/** @returns {number} */
export function dispatch() {
  return consume(1, 2, 3);
}

function consume(...values) {
  const first = values.shift();
  values.push(4);
  const object = JSON.parse('{}');
  Object.defineProperties(object, { score: { value: 5, enumerable: true } });
  const add = (left, right) => left + right;
  return Number(first) + values.join("").length + Number(object.score) + Number(add.apply(null, [6, 7]));
}


/** @type {unknown} */
let heldDecoder;
/** @type {unknown} */
let heldEncoder;
let codecPhase = 0;

/** @returns {number} */
export function initCodecs() {
  heldDecoder = new TextDecoder();
  heldEncoder = new TextEncoder();
  codecPhase = 0;
  return 1;
}

/** @returns {number} */
export function codecStep() {
  // Separate exports and unknown globals retain the actual boxing and
  // checked unboxing calls, including across the library result reset.
  const decoder = /** @type {TextDecoder} */ (heldDecoder);
  const encoder = /** @type {TextEncoder} */ (heldEncoder);
  if (codecPhase++ === 0) {
    return decoder.decode(new Uint8Array([0xe2]), { stream: true }).length;
  }
  const tail = decoder.decode(new Uint8Array([0x82, 0xac]));
  return tail === "€" && decoder === heldDecoder && encoder.encode("ok").length === 2 ? 1 : -1;
}
