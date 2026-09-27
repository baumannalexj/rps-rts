# Working in this repo

Read `docs/ARCHITECTURE.md` first. It has the package boundaries and rules.

## Specialist roles

Work is split so each role needs only a small context. Stay inside your area; if you need something from another area, change or request a change to the contract in `packages/contracts`, not the other side's code.

| Role | Area | Reads | Backlog |
|---|---|---|---|
| Contracts / architect | `packages/contracts`, `docs/ARCHITECTURE.md`, CI | everything | `docs/backlog/game-architecture.md` |
| Core domain & model | `packages/core` | contracts | `docs/backlog/economy.md`, `military.md`, `diplomacy.md` |
| AI governors | `packages/core/src/adapters/policies` | contracts, core domain | `docs/backlog/ai-governors.md` |
| View / presentation | `apps/web` | contracts | `docs/backlog/factions-art.md` |
| Infrastructure | `.github/`, hosting, future server | architecture doc | `docs/backlog/infrastructure.md` |

## Commands

```
npm install
npm run typecheck
npm test            # node --test over packages/*/test and apps/*/test
npm run dev         # Vite dev server for apps/web
npm run build
npm run check       # all of the above
```

## Conventions

- `import type` for anything from `@rps/contracts`.
- Relative imports end in `.ts`.
- No `enum`, `namespace`, or constructor parameter properties (Node type stripping).
- Tests mirror `src/` paths under `test/`, named `*.test.ts`.
- Work on a branch; `main` deploys to GitHub Pages.
