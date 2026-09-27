# Economy & Market Backlog

Core: SupCom-style banks. Everything is a flow (+x/s income, −y/s spend). Trade contracts are just flows between banks.

Triangle: Paper → Water (needs Energy, Carbon) · Scissors → Energy (needs Carbon, Water) · Rock → Carbon (needs Water, Energy)

- ECO-1 `[now]` Bank model: per-resource stock, storage cap, income/spend per tick. Prototype v0.
- ECO-2 `[now]` Extractors consume off-native inputs; efficiency drops when inputs short. Prototype v0.
- ECO-3 `[now]` Self-production converter at a penalty (default 3:1) → natural trade price ceiling. Prototype v0.
- ECO-4 `[now]` Streaming contracts with cancellation notice. Prototype v0 (bilateral, bot-negotiated).
- ECO-5 `[next]` Public order book per resource pair (bids/asks visible), replace bilateral negotiation.
- ECO-6 `[next]` Resource decay above a storage threshold (makes flow > stockpile).
- ECO-7 `[later]` Asymmetric demand curves by tech tier (Paper early Carbon-heavy, late Energy-heavy, etc.).
- ECO-8 `[later]` Byproducts/waste (slag, steam, pulp) that clog storage but are useful to another faction.
- ECO-9 `[later]` 4th resource from trade volume (Influence/Trust) gating top tech or victory.
- ECO-10 `[idea]` Factorio-style production chains (intermediate goods) — only if macro gets too flat.
- ECO-11 `[idea]` Stellaris-style layered economy (planet/system/galaxy) for the persistent map.
- ECO-12 `[later]` Tuning targets: what trade share of income is "healthy"? (define metric for sim runs)

Open questions: price discovery vs fixed-ish rates? Can contracts default? Reputation tracking? → diplomacy

## Sim findings (v0)
- F-1: All-Merchant matches settle into steady prosperity (~16 extractors each, full efficiency, heavy trade on all 3 pairs).
- F-2: Any raiding triggers an embargo spiral. The victim cuts off the raider, the raider loses one of its two input suppliers, and efficiency collapses for everyone. Warlords starve their own supply chain. → Needs a way back from embargo (ECO-14) or it will dominate every match.
- ECO-13 `[next]` Over-expansion guard: governors only grow when input supply covers the new extractor (patched in v0; revisit with the order book).
- ECO-14 `[next]` Embargo recovery: reparations / peace deals, or a neutral market with worse rates so an embargoed faction isn't locked out.
