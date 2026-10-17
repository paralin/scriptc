# paralin/scriptc

This fork builds scriptc from upstream `vercel-labs/scriptc` with fixes that
have not been released upstream yet. Modlock downloads its compiler from this
fork's GitHub releases until upstream ships the fixes.

## Branches

- `main` mirrors upstream `main` and never carries fork commits.
- Each fix lives on its own branch based on `main`, ready to send upstream as a
  pull request.
- `fork` is `main` with every open fix branch merged, plus this file and
  `.github/workflows/fork-release.yml`. Releases are tagged on `fork`.

## Patches

| Branch                    | Fixes                                                                    | Upstream |
| ------------------------- | ------------------------------------------------------------------------ | -------- |
| `generic-class-callbacks` | Generic class methods and union checks on optional class fields (#1, #2) | open     |

Drop a branch from `fork` once upstream releases its fix.

## Releases

A tag `v<upstream version>-paralin.<n>` on `fork` runs `fork-release.yml`. It
stamps the tag's version into every package, builds the standalone compiler for
darwin-arm64, linux-x64-gnu, linux-arm64-gnu and win32-x64-msvc and the
wasm32-wasi runtime pack, and attaches them with `SHA256SUMS` to a prerelease.
Nothing is published to npm.
