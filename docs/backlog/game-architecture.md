# Game Architecture Backlog (how the game is structured — independent of where it runs)

Principle: the sim core is a pure, deterministic function. `step(state, actions, config) → state`, seeded RNG, fixed tick. It doesn't know about browsers, servers, or networks.

- GA-1 `[now]` Browser prototype with core + UI in one page (v0 artifact). Core already written as a pure module (`sim-core.js`).
- GA-2 `[next]` Move core to TypeScript package `@rps/core`; add unit tests + golden replays (same seed → same result).
- GA-3 `[next]` Action/command model: every player or bot input is a serializable action with a tick number. Enables replays, networking, and bots through one interface. (→ ai-governors AI-3)
- GA-4 `[next]` Headless runner (Node CLI): batch matches, CSV/JSON output, strategy tournaments.
- GA-5 `[next]` Web client: Vite + TypeScript (+ React for panels/menus, canvas/PixiJS for the map). Static hosting.
- GA-6 `[later]` State snapshots + deltas format (for save/load, persistence, network sync).
- GA-7 `[later]` Region/shard boundaries in the state model (map split into regions that can tick independently and exchange cross-region events). Needed before any distributed hosting.
- GA-8 `[idea]` C#/Unity or Godot port only if 3D/native becomes a goal; pure core keeps it mechanical.
