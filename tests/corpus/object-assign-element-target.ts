// Object.assign into a record or class instance read from an array inside a
// function, where the index may be out of bounds: the copy writes each source
// field into the element in place, and a missing element throws Node's
// TypeError after both arguments evaluate.
interface Fighter {
  kills: number;
  deaths: number;
  tag?: string;
}
const fighters: Fighter[] = [
  { kills: 3, deaths: 1 },
  { kills: 5, deaths: 2, tag: "b" },
];

function reset(i: number): number {
  const fighter = fighters[i];
  Object.assign(fighter, { kills: 0, deaths: 0 });
  return fighter.kills + fighter.deaths;
}

function retag(i: number, tag?: string): Fighter {
  const patch: { tag?: string } = {};
  if (tag !== undefined) patch.tag = tag;
  return Object.assign(fighters[i], patch);
}

class Counter {
  hits = 1;
  misses = 2;
}
const counters: Counter[] = [new Counter()];
function clear(i: number): Counter {
  return Object.assign(counters[i], { hits: 0 });
}

let order = "";
function source(): { kills: number } {
  order += "source;";
  return { kills: 9 };
}

console.log(reset(0), fighters[0].kills, fighters[0].deaths);
console.log(retag(1).tag, retag(1, "c").tag, fighters[1].kills);
const same = clear(0);
console.log(same === counters[0], counters[0].hits, counters[0].misses);
try {
  reset(7);
} catch (e) {
  console.log((e as Error).name, (e as Error).message);
}
try {
  Object.assign(fighters[9], source());
} catch (e) {
  console.log(order, (e as Error).message);
}
try {
  clear(3);
} catch (e) {
  console.log((e as Error).name);
}
