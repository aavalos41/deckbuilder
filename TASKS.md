# Tasks

Work top to bottom. Each task should be one small, shippable change (tests + build pass, then push).
Move finished tasks to **Done** with the date. Add new ideas to **Backlog**.

## Up next

### 1. Status effects: Vulnerable, Weak, Poison
Statuses that stack on both player and enemies.

- **Vulnerable (n):** takes 50% more attack damage. Loses 1 stack at end of the owner's turn.
- **Weak (n):** deals 25% less attack damage. Loses 1 stack at end of the owner's turn.
- **Poison (n):** at start of the owner's turn, lose n HP (ignores block), then poison drops by 1.

Implementation notes:
- `types.ts`: add `statuses: { vulnerable: number; weak: number; poison: number }` to `Combatant`.
  Bump `RunState.version` to 2 (and in `save.ts`).
- Add an `applyStatus` effect: `{ type: 'applyStatus'; status: StatusId; amount: number; target: 'enemy' | 'self' }`.
- `combat.ts`: one damage-calc function used by both player and enemy attacks
  (strength → weak → vulnerable, round down). Tick statuses at the right turn boundaries.
- Enemy intents: allow enemies to apply statuses (e.g. intent `{ type: 'debuff', status, amount }`).
- UI: show status chips under each HP bar (e.g. `Vuln 2`, `Weak 1`, `Poison 4`), tappable/long-press for a one-line explanation.
- Tests: damage maths with each status, poison tick + decay, durations decrement correctly.

### 2. Cards that use statuses
Add ~6 cards to the reward pool, e.g.:
- *Expose* (1): apply 2 Vulnerable.
- *Cripple* (1): deal 4, apply 1 Weak.
- *Toxin* (1): apply 4 Poison.
- *Venom Strike* (1): deal 5, apply 2 Poison.
- *Catalyst* (1): double the enemy's Poison.
- *Brace* (1): gain 6 block, remove your Weak.
Plus one enemy that applies Weak and one that applies Vulnerable.

### 3. Player strength cards
- *Inflame* (1): gain 2 Strength for this combat.
- *Flex* (0): gain 2 Strength this turn, lose it at end of turn (needs a temporary-strength mechanic).

### 4. Relics
Passive items. Start with ~5, one granted after the boss-of-act / elite (or every 2 fights until the map exists).
Hook points: start of combat, start of turn, on card played, on damage taken.

### 5. Branching map
Replace the linear run with a small node map: fight, elite, rest (heal 30% or upgrade a card), shop, boss.

## Backlog
- Card upgrades (needs rest sites)
- Exhaust keyword (card removed for the rest of combat)
- Card removal (shop service)
- Run history / stats screen (best floor, wins, seed)
- Share a seed via URL (`?seed=123`)
- Simple sound effects (toggleable)
- More characters
- Play Store wrapper (Capacitor or TWA)

## Done
- 2026-10-24 — Initial game: combat engine, 12 cards, 6 enemies, 5 fights + boss, rewards, saves, PWA, deployed.
