# rps-rts

A rock paper scissors real-time strategy game, starting with its economy. Paper makes water, Scissors makes energy, Rock makes carbon, and each needs the other two. Factions trade through streaming contracts, raid each other, and are run by swappable AI governors.

This repo holds the economy simulator: a deterministic engine you can watch, tweak live, and test.

- **Live simulator:** https://baumannalexj.github.io/rps-rts/ (deployed from `main`)
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Backlogs by discipline:** [docs/backlog/](docs/backlog/README.md)

## Quick start

```
npm install
npm run dev
```

Requires Node 22.18 or newer (tests run TypeScript directly with `node --test`).
