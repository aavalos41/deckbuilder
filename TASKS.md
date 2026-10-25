# Tasks

Work top to bottom. Each task should be one small, shippable change (tests + build pass, then push).
Move finished tasks to **Done** with the date. Add new ideas to **Backlog**.

## Up next

### 1. Status effects: Vulnerable, Weak, Poison
Statuses that stack on both player and enemies.

- **Vulnerable (n):** takes 50% more attack damage.
- **Weak (n):** deals 25% less attack damage.
- **Vulnerable/Weak duration:** lose 1 stack at the start of the *opponent's* turn
  (on an enemy → ticks at player turn start; on the player → ticks at enemy turn start).
  So n = number of the applier's turns it lasts, including the current one. No "just applied" flag needed.
- **Poison (n):** at start of the owner's turn, lose n HP (ignores block), then poison drops by 1.

Implementation notes:
- `types.ts`: add `statuses: { vulnerable: number; weak: number; poison: number }` and `strength: number`
  (default 0, used by task 3) to `Combatant`. Bump `RunState.version` to 2 (and in `save.ts`).
- Add an `applyStatus` effect: `{ type: 'applyStatus'; status: StatusId; amount: number; target: 'enemy' | 'self' }`.
- `combat.ts`: one damage-calc function used by both player and enemy attacks
  (strength → weak → vulnerable, round down). Tick statuses at the right turn boundaries.
- Enemy intents: allow enemies to apply statuses (e.g. intent `{ type: 'debuff', status, amount }`).
- UI: show status chips under each HP bar (e.g. `Vuln 2`, `Weak 1`, `Poison 4`), tappable/long-press for a one-line explanation.
- Tests: damage maths with each status, poison tick + decay, durations decrement correctly.
  Specifically: enemy-applied Weak 1 affects exactly one player turn; player-applied Vulnerable 2
  affects exactly two player turns.

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

## Design (decide in a project chat, not code)
- **Core identity / twist.** The current base (3 energy, Strike/Defend, intents, Vulnerable/Weak/Poison,
  relics, branching map) is very close to Slay the Spire. Pick 1–2 signature mechanics that make this game
  its own *before* adding lots of content, and rename generic terms to fit a theme.
- **Setting and tone.** Decide the world so races, classes, card and enemy names feel like one place.

## Backlog
- **Character selection: race + class.** Class defines the deck and its signature mechanic
  (e.g. Engineer: gadgets that stay in play; Warlock: cards that cost HP instead of energy).
  Race is a small layer: a passive + 1–2 starter card swaps (e.g. Dwarf: +block on first turn; Elf: draw 1 extra on turn 1).
  Start with 2 races × 2 classes and keep races light so combos stay balanced.
  Needs: character select screen, starter deck per class, race modifiers applied at run start.
- **Animation pass (functional, CSS-first).** Card flies to enemy when played, floating damage/block numbers,
  hit shake, HP bar ease, enemy intent pulse, card draw slide-in. Respect `prefers-reduced-motion`.
  No animation library unless CSS can't do it.
- **Card and enemy art.** Pick one consistent style first (e.g. single-colour silhouettes/icons) and an asset
  pipeline with clear licensing (own work, commissioned, or generated with rights you're happy to sell under).
  Cards keep working without art; art is an optional `image` field on card/enemy data.
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
