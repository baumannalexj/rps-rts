# System Infrastructure Backlog (where and how it runs)

Depends on the game architecture exposing: pure core, action log, snapshots, region boundaries (GA-3, GA-6, GA-7).

Staged path:
- INF-1 `[now]` Static hosting only (artifact / GitHub Pages / S3+CloudFront). Sim runs in the browser. $0 servers.
- INF-2 `[next]` Single authoritative server: Node + WebSocket (Colyseus or plain `ws`) running `@rps/core`; clients send actions, server broadcasts deltas. One container, one region.
- INF-3 `[later]` Persistence: snapshot to Postgres/DynamoDB/S3 every N ticks + append-only action log (replays, crash recovery).
- INF-4 `[later]` Sharding: one process per map region; cross-region trade/raids via a message bus (NATS/Redis streams). Tick coordinator.
- INF-5 `[idea]` Volunteer compute: players run a Docker container that hosts regions/shards.
  - Needs: trust model (volunteer can cheat or drop) → run each region on 2+ nodes and compare state hashes (deterministic core makes this cheap), or have volunteers compute only non-authoritative work (bot AI, analytics, replays).
  - Needs: NAT traversal / relay, node reputation, fast failover (snapshot hand-off), anti-cheat for players hosting their own region.
  - Lower-risk first steps: volunteers run AI governors and headless sim batches (no authority over live state).
- INF-6 `[later]` Observability: tick time, desync rate, player count per region.
