// A write through a runtime key can replace any method, so method reads go
// through the receiver's properties. Generic classes keep no prototype data:
// their methods still answer every call path, and an own write still shadows
// one instance's method, as under Node.
function setKey(target: Record<string, unknown>, key: string, value: unknown): void {
  target[key] = value;
}
setKey({}, process.argv.length > 99 ? "x" : "y", 1);

interface Getter<T> {
  get(): T;
}
class Box<T> implements Getter<T> {
  private readonly value: T;
  constructor(value: T) {
    this.value = value;
  }
  get(): T {
    return this.value;
  }
  twice(): string {
    return `${this.value}${this.value}`;
  }
}
class Labeled extends Box<string> {
  label(): string {
    return `[${this.get()}]`;
  }
}
class Plain {
  get(): number {
    return 9;
  }
}

function attempt(name: string, run: () => unknown): void {
  try {
    console.log(name, run());
  } catch (e) {
    console.log(name, "threw", String(e));
  }
}

attempt("direct", () => new Box(1).get());
attempt("subclass", () => new Labeled("a").label());
const either: Box<number> | Plain = process.argv.length > 99 ? new Plain() : new Box(2);
attempt("union", () => either.get());
const getter: Getter<number> = new Box(3);
attempt("interface", () => getter.get());
attempt("bound", () => {
  const box = new Box(4);
  return box.twice.bind(box)();
});
attempt("typeof", () => typeof new Box(5).get);
attempt("map", () => [new Box(7), new Box(8)].map((box) => box.get()).join(","));

const replaced = new Box(10);
replaced.get = () => 11;
const untouched = new Box(12);
attempt("own write", () => `${replaced.get()} ${untouched.get()}`);
const replacedGetter: Getter<number> = replaced;
attempt("own write via interface", () => replacedGetter.get());
attempt("own key", () => `${Object.hasOwn(replaced, "get")} ${Object.hasOwn(untouched, "get")}`);
