// A value that crosses a dynamically dispatched call stays the same object:
// a write through the call's argument or result reaches the original. The
// runtime-key write below makes class method calls dispatch dynamically.

interface Seat {
  waiting: string;
}

class Box {
  readonly item: Seat = { waiting: "" };
  readonly items: number[] = [1];
  get(): Seat {
    return this.item;
  }
  list(): number[] {
    return this.items;
  }
  mark(seat: Seat): void {
    seat.waiting = "marked";
  }
}

function setKey(o: Record<string, unknown>, k: string, v: unknown): void {
  o[k] = v;
}
setKey({ other: 1 }, "other", 2);

const box = new Box();

// A returned record is the stored record.
const seat = box.get();
seat.waiting = "after-return";
console.log(seat === box.item, box.item.waiting);

// A returned array is the stored array.
const items = box.list();
items.push(2);
console.log(items === box.items, box.items.length);

// An argument is the caller's record.
const other: Seat = { waiting: "" };
box.mark(other);
console.log(other.waiting);

async function load(): Promise<Seat> {
  return box.item;
}
load().then((loaded) => {
  loaded.waiting = "after-await";
  console.log(loaded === box.item, box.item.waiting);
});
