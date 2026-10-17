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

| Branch               | Fixes                                              | Upstream |
| -------------------- | -------------------------------------------------- | -------- |
| `library-decl-adopt` | Libraries with class casts link `scr_decl_adopt.c` | open     |

Upstream fixed generic class methods (#1), union checks on optional class
fields (#2) and references across dynamic calls (#8) on its own, so the fork no
longer carries those patches. Drop a fix from `main` once upstream releases it.

## Releases

A tag `v<upstream version>-paralin.<n>` on `main` runs `fork-release.yml`. It
stamps the tag's version into every package, builds the standalone compiler for
darwin-arm64, linux-x64-gnu, linux-arm64-gnu and win32-x64-msvc and the
wasm32-wasi runtime pack, and attaches them with `SHA256SUMS` to a prerelease.
Nothing is published to npm.
