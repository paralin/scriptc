'use strict';
// A timer callback runs with `this` bound to its Timeout or Immediate, as
// Node calls it: a plain function and a function value that forwards
// `this` (test/common's mustCall wrapper) see the handle the call returned,
// also with trailing arguments and for a setTimeout called as a statement.
// clearInterval(this) stops an interval from inside it, and the clear
// functions accept the handle a callback reads as its own `this`. Arrows
// keep the module's `this`, and a nested plain call sees undefined.
function forwarding(fn) {
  return function (...args) {
    return fn.apply(this, args);
  };
}

const seen = [];
const immediate = setImmediate(function () {
  seen.push(['immediate', this === immediate]);
});
const immediateArgs = setImmediate(forwarding(function (word) {
  seen.push(['immediate args', this === immediateArgs, word]);
}), 'hello');
const timeout = setTimeout(forwarding(function () {
  seen.push(['timeout', this === timeout]);
}), 1);
let statementThis;
setTimeout(function () {
  statementThis = this !== undefined;
});
let ticks = 0;
const interval = setInterval(function () {
  ticks++;
  if (ticks === 2) clearInterval(this);
  seen.push(['interval', this === interval, ticks]);
}, 1);
const clearedImmediate = setImmediate(function () {
  clearImmediate(this);
  seen.push(['clearImmediate', this === clearedImmediate]);
});
const clearedTimeout = setTimeout(function () {
  clearTimeout(this);
  seen.push(['clearTimeout', this === clearedTimeout]);
}, 1);
setTimeout(() => {
  seen.push(['arrow', this === module.exports]);
}, 2);
function plain() {
  return this;
}
setTimeout(function () {
  seen.push(['nested plain call', plain() === undefined]);
}, 3);

setTimeout(() => {
  // Sorted, so the order the timers fire in does not decide the output.
  for (const entry of seen.map((e) => e.join(' ')).sort()) console.log(entry);
  console.log('statement setTimeout has this', statementThis, 'ticks', ticks);
}, 30);
