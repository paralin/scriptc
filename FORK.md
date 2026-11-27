# paralin/scriptc

This fork builds scriptc from upstream `vercel-labs/scriptc` with fixes that
have not been released upstream yet. Modlock downloads its compiler from this
fork's GitHub releases until upstream ships the fixes.

## Branches

- `main` is upstream `main` with the fork's fixes, this file and
  `.github/workflows/fork-release.yml` on top, as a linear history. To follow
  upstream, rebase `main` onto upstream `main`. Releases are tagged on `main`.
- Each fix also lives on its own branch based on upstream `main`, ready to send
  upstream as a pull request.

## Patches

| Branch                              | Fixes                                                  | Upstream |
| ----------------------------------- | ------------------------------------------------------ | -------- |
| `library-decl-adopt`                | Libraries with class casts link `scr_decl_adopt.c`     | open     |
| `object-assign-element`             | `Object.assign` into an array element compiles         | open     |
| `nullish-assignment-call`           | A call on an inline `??=` assignment compiles          | open     |
| `map-union-has-delete`              | `has` and `delete` on a union of Maps compile          | open     |
| `tuple-element-compound-assignment` | Compound assignment to a tuple element compiles        | open     |
| `untyped-let-hole-read`             | An untyped `let` read before assignment is `undefined` | open     |
| `wasm-malloc`                       | wasm32-wasi programs link dlmalloc as `malloc`         | not sent |
| `json-finish-fit`                   | A finished JSON string gives back its unused buffer    | not sent |
| `json-test-context`                 | The JSON runtime test links scr_context.c              | not sent |
| `logical-typeof-guards`             | Typeof guards narrow short-circuit operands            | not sent |
| `optional-chain-checker-arms`       | Optional chains preserve stable and changing receiver arms    | not sent |
| `wasi-library-sync-generators`      | WASI libraries accept synchronous generators           | not sent |
| `unknown-field-presence`            | An unknown-valued field keeps its undefined payload    | not sent |
| `discriminated-record-exact-arm`    | Empty oneof payloads retain their discriminator tags   | not sent |
| `guarded-char-unit-locals`         | Guarded optional characters keep code-unit comparisons | not sent |
| `native-frontend-build-receipt`    | Native frontend checks keep complete build receipts off stdout | not sent |
| `linked-source-json`               | JSON preserves retained fields and restores source-free static writers | not sent |
| `library-checked-runtime`          | Library archives retain boxed codecs and declaration adoption | not sent |
| `optional-network-writer-chunks`   | Network writers normalize optional string and byte chunks | not sent |
| `checked-class-union-routes`       | JS union boundaries test subclasses stored through base arms | not sent |
| `fix/owned-process-heap-20261125`   | Owned compiler builds collect under heap pressure and keep separate CLI budgets | fork only |

The `library-checked-runtime` handoff includes the existing library adoption
unit and WASI synchronous-generator patches as prerequisites for its shared
library run-through. Its feature projection repair is commit `269375a073`.

The fork now builds on upstream `main` after 0.4.17. Each fix's corpus program
still fails under upstream's 0.4.17 compiler, except two that guard the fork's
own changes: `nullish-assignment-union-value` covers a case that the fork's
`??=` call path broke, and `union-primitive-arm-members` was already in
upstream's corpus before the fork extended it.

Upstream fixed generic class methods (#1), union checks on optional class
fields (#2) and references across dynamic calls (#8) on its own, so the fork no
longer carries those patches. Drop a fix from `main` once upstream releases it.

## Releases

A tag `v<upstream version>-paralin.<n>` on `main` runs `fork-release.yml`. It
stamps the tag's version into every package, builds the standalone compiler for
darwin-arm64, linux-x64-gnu, linux-arm64-gnu and win32-x64-msvc and the
wasm32-wasi runtime pack, and attaches them with `SHA256SUMS` to a prerelease.
Nothing is published to npm. The tag names the version in upstream's
`package.json`, so a release built on unreleased upstream `main` carries that
version and the upstream commits after it.
