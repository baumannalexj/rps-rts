# AI Governors (Bots) Backlog

Bots are the sim's players AND the persistent-map stand-ins when humans leave.

- AI-1 `[now]` Strategy policies: Merchant, Warlord, Balanced (prototype v0).
- AI-2 `[next]` Hoarder / Turtle policy (defensive, self-sufficient).
- AI-3 `[next]` Policy interface: observe(state) → actions (build, post/accept/cancel contract, attack). Same interface human input uses.
- AI-4 `[later]` Takeover: human leaves → governor inherits faction and honors existing contracts.
- AI-5 `[later]` Tournament runner: N seeds × policy matchups → win rates, to detect dominant strategies.
- AI-6 `[idea]` Learned/evolved policies (param search over bot weights).
