type Step<T> = { readonly done?: false } | { readonly done: true; readonly value: T };
interface Work<T> { next(): Step<T> }

function once<T>(finish: () => T): Work<T> {
  return { next: () => ({ done: true, value: finish() }) };
}

function consume(stage: () => Work<unknown>): void {
  const step = stage().next();
  if (step.done) console.log("done", step.value === undefined);
  else console.log("pending");
}

consume(() => once(() => undefined));
consume(() => once(() => 4));
const pending: Work<unknown> = { next: () => ({ done: false }) };
consume(() => pending);
