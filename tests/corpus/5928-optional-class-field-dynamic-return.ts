// A record with an optional class-typed field crosses a dynamic call as its
// own value: the checked `T | undefined` return still accepts the class
// instance in the field, as under Node.
function setKey(target: Record<string, unknown>, key: string, value: unknown): void {
  target[key] = value;
}
setKey({}, process.argv.length > 99 ? "x" : "y", 1);

class Seat {
  readonly slot: number;
  constructor(slot: number) {
    this.slot = slot;
  }
}
interface Duelist {
  ordinal: number;
  seat?: Seat;
}
class Echo {
  echo(duelist: Duelist): Duelist | undefined {
    return duelist;
  }
}

const echo = new Echo();
const seated = echo.echo({ ordinal: 1, seat: new Seat(4) });
console.log(seated?.ordinal, seated?.seat?.slot, seated?.seat instanceof Seat);
const standing = echo.echo({ ordinal: 2 });
console.log(standing?.ordinal, standing?.seat, standing !== undefined && "seat" in standing);
const cleared = echo.echo({ ordinal: 3, seat: undefined });
console.log(cleared?.ordinal, cleared?.seat, cleared !== undefined && "seat" in cleared);
const value: unknown = { ordinal: 5, seat: new Seat(6) };
const checked = value as Duelist | undefined;
console.log(checked?.seat?.slot);
