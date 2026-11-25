// An empty message's ABI matches unknown payloads, but its oneof tag must
// not override the explicit case of a populated or empty running message.
interface Switching {}
interface Running { setup?: { seed?: number }; result?: string }
interface Failed { error?: string }
interface State {
  slug?: string;
  state?:
    | { value?: undefined; case: undefined }
    | { value: Switching; case: "switching" }
    | { value: Running; case: "running" }
    | { value: Failed; case: "failed" };
}

function nested(s: State): string {
  if (s.state?.case === "running") {
    const value = s.state.value;
    return `running:${value.result ?? "empty"}:${value.setup?.seed ?? 0}`;
  }
  if (s.state?.case === "failed") return `failed:${s.state.value.error ?? "empty"}`;
  if (s.state?.case === "switching") return "switching";
  return "none";
}

function local(s: State): string {
  const state = s.state;
  switch (state?.case) {
    case "running": return `running:${state.value.result ?? "empty"}:${state.value.setup?.seed ?? 0}`;
    case "failed": return `failed:${state.value.error ?? "empty"}`;
    case "switching": return "switching";
    default: return "none";
  }
}

// The generated protobuf-es JSON shape uses message names as keys and then
// builds a tagged oneof from each decoded value, including empty messages.
const State = {
  fromJsonString(text: string): State {
    const json = JSON.parse(text) as {
      slug?: string;
      switching?: Switching;
      running?: Running;
      failed?: Failed;
    };
    return {
      slug: json.slug,
      state: json.running !== undefined ? { case: "running", value: json.running }
        : json.switching !== undefined ? { case: "switching", value: json.switching }
        : json.failed !== undefined ? { case: "failed", value: json.failed }
        : undefined,
    };
  },
};

const states: State[] = [
  { slug: "s", state: { case: "switching", value: {} } },
  { slug: "r", state: { case: "running", value: {} } },
  { slug: "r", state: { case: "running", value: { result: "ready", setup: { seed: 7 } } } },
  { slug: "f", state: { case: "failed", value: { error: "broken" } } },
  { slug: "f", state: { case: "failed", value: {} } },
  { slug: "none" },
  { state: { case: undefined } },
];
for (const state of states) console.log("literal", nested(state), local(state));
for (const text of [
  '{"switching":{}}', '{"running":{}}',
  '{"running":{"result":"decoded","setup":{"seed":9}}}',
  '{"failed":{"error":"decoded"}}', '{}',
]) {
  const state = State.fromJsonString(text);
  console.log("json", nested(state), local(state));
}

// The checked dynamic boundary must retain the same literal ownership and
// keep the unit-only absent record distinct from the literal cases.
for (const text of [
  '{"state":{"case":"running","value":{}}}',
  '{"state":{"case":"running","value":{"result":"tagged"}}}',
  '{"state":{"case":"failed","value":{}}}',
  '{"state":{}}', '{}',
]) {
  const state = JSON.parse(text) as State;
  console.log("tagged", nested(state), local(state));
}
// A shared required unit field is not a scalar discriminator. Continue to
// the literal field even when the unit field was declared first.
type Marked =
  | { marker: undefined; kind: "switching"; value: Switching }
  | { marker: undefined; kind: "running"; value: Running };
function marked(state: Marked): string {
  if (state.kind === "running") return state.value.result ?? "empty";
  return "switching";
}
const markedStates: Marked[] = [
  { marker: undefined, kind: "switching", value: {} },
  { marker: undefined, kind: "running", value: {} },
  { marker: undefined, kind: "running", value: { result: "marked" } },
];
for (const state of markedStates) console.log("marked", marked(state));
