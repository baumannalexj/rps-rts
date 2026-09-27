# Architecture

Hexagonal (ports and adapters). Dependencies point inward, toward `@rps/contracts`.

```
apps/web  ──uses──▶  SimulationPort (interface)  ◀──implements──  core/runtime/LocalSimulationPort
                                                                      │ drives
                                                                      ▼
                                              SimulationEngine (interface) ◀── core/engine/Engine
                                                                      │ calls
                         ┌──────────────┬───────────────┬─────────────┼──────────────┐
                   GovernorPolicy   PricingModel   TradeNegotiator  CombatResolver  RandomSource
                   (merchant, …)   (scarcity, …)   (bilateral, …)   (rps, …)        (mulberry32)
```

## Packages

| Package | Owns | May import |
|---|---|---|
| `packages/contracts` | Types and interfaces only. No runtime code. | nothing |
| `packages/core` | Domain model classes, engine, default adapters, `LocalSimulationPort` | `@rps/contracts` (types only) |
| `apps/web` | Presentation: presenters, canvas charts, controls, composition root | `@rps/contracts` types everywhere; `@rps/core` **only** in `src/main.ts` |
| `tools/runner` (planned) | Headless batch runs and strategy tournaments | `@rps/core` |

## Rules

1. **Contracts are types only.** `import type` from `@rps/contracts`, always.
2. **Swap by adapter, not by `if`.** A new pricing idea is a new `PricingModel` class registered in the `AdapterSet`, not a flag inside the engine.
3. **Determinism.** Engine and adapters take randomness only from the injected `RandomSource`. Same seed and commands give the same match. No `Math.random`, `Date.now`, or timers in `packages/core/src/domain` or `engine`.
4. **The view only sees `SimulationPort`.** It never touches the engine or domain classes. That lets us swap the local adapter for a Web Worker or a server later.
5. **Classes wrap state; snapshots cross boundaries.** Domain classes (`Faction`, `Bank`, `Contract`, `World`) are mutable inside the engine. Everything leaving the engine is a readonly snapshot.
6. **Tests mirror source.** `packages/core/src/domain/Bank.ts` is tested by `packages/core/test/domain/Bank.test.ts`. Same for `apps/web`.
7. **Erasable TypeScript only** (`erasableSyntaxOnly`). No `enum`, no `namespace`, no constructor parameter properties. Node runs tests on `.ts` files directly with `node --test`, no build step. Relative imports include the `.ts` extension.

## Changing a contract

Contracts are the handshake between specialists. Propose the change in the PR description, update `packages/contracts`, then update both sides. Don't widen a contract to fit one implementation's shortcut.

## Toolchain

- TypeScript (strict), npm workspaces, Node 22.18+.
- Tests: Node's built-in `node:test` + `node:assert/strict`. No test framework dependency.
- Web build: Vite. Deployed by `.github/workflows/pages.yml` on push to `main`.
- CI: `.github/workflows/ci.yml` runs typecheck, tests and build on every branch and PR.
