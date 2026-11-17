# Tasks

Work top to bottom. Each task should be one small, shippable change (tests + build pass, then push).
Move finished tasks to **Done** with the date. Add new ideas to **Backlog**.

## Up next

### 6. Branching map
Replace the linear run with a small node map: fight, elite, rest (heal 30% or upgrade a card), shop, boss.

## Design (decide in a project chat, not code)
- **Core identity / twist.** The current base (3 energy, Strike/Defend, intents, Vulnerable/Weak/Poison,
  relics, branching map) is very close to Slay the Spire. Pick 1–2 signature mechanics that make this game
  its own *before* adding lots of content, and rename generic terms to fit a theme.
- **Setting and tone.** Leaning Nahua: the last night of the 52-year cycle, travel to light the New Fire
  before the tzitzimimeh descend. Codex-style art, glyph icons, bar-and-dot counters. Levers: Class
  (Warrior, Shaman — Shaman prioritised over Tlacuilo, which felt harder to grasp) + Patron (Jaguar, Eagle).
  Names/mechanics locked in task 5b; still no art/full theme pass.

## Backlog
- Warrior has no class-only card pool yet (all old cards are neutral). Consider moving Strength cards
  (Inflame, Flex, Bash, Cleave) into it so Shaman runs don't see them.
- Show dodge/crit chance as chips when a this-turn boost is active.
- **Animation pass (functional, CSS-first).** Card flies to enemy when played, floating damage/block numbers,
  hit shake, HP bar ease, enemy intent pulse, card draw slide-in. Respect `prefers-reduced-motion`.
  No animation library unless CSS can't do it.
- **Card and enemy art.** Pick one consistent style first (e.g. single-colour silhouettes/icons) and an asset
  pipeline with clear licensing (own work, commissioned, or generated with rights you're happy to sell under).
  Cards keep working without art; art is an optional `image` field on card/enemy data.
- Card upgrades (needs rest sites)
- Card removal (shop service)
- Run history / stats screen (best floor, wins, seed)
- Share a seed via URL (`?seed=123`)
- Simple sound effects (toggleable)
- More characters
- Play Store wrapper (Capacitor or TWA)

## Done
- 2026-11-17 — Loadout sources (Class + Patron): `src/data/loadouts.ts` (Warrior, Shaman, Jaguar, Eagle),
  `LOADOUT_KINDS` config, `buildRunLoadout` merges starter decks / pools / passive relics; run stores
  `loadout`. Neutral `REWARD_POOL` = non-starter cards no source claims. New effects: `damage.lifesteal`,
  `gainChance`, `chanceThisTurn` (lasts until your next turn, so dodge covers the enemy turn). Dodge/crit
  rolled per hit, only when the chance is > 0. Passives are relics, never offered as rewards. Title-screen
  picker. Save version 6.
- 2026-11-17 — Exhaust + exile pile: `exhaust?: boolean` on `CardDef`; played exhaust cards go to
  `combat.exile` (never reshuffled, fresh each combat). Cards show "Exhaust.", combat shows Exile count.
  No cards use it yet (5b). Save version 5.
- 2026-11-02 — Relics: data in `src/data/relics.ts` (Whetstone, Iron Ring, Lantern, Ember Heart, Spiked Glove),
  hooks combatStart / turnStart / cardPlayed / combatEnd via `fireRelics`. Pick 1 of 2 after floors 1 and 3
  (`RELIC_FLOORS`), relic chips under player HP. Save version 4.
  Later: `damageTaken` hook, counter relics, relic rarity, shop.
- 2026-11-02 — Rarity-weighted rewards: each slot rolls common 60 / uncommon 30 / rare 10 (`RARITY_WEIGHTS`
  in `cards.ts`), no duplicates, falls back to the most common rarity left. `weightedIndex` in `rng.ts`.
- 2026-11-02 — Strength cards: Inflame (1, rare until Exhaust/powers exist) and Flex (0, common). New effect
  `gainStrength` (`temporary` flag) and `strengthDown` status that removes temp Strength at end of your turn.
  Save version bumped to 3.
- 2026-10-28 — Status cards: Expose, Cripple, Toxin, Venom Strike, Brace, Catalyst (cost 2 / rare until Exhaust
  exists). New effects `multiplyStatus` and `removeStatus`. Enemies: Spore Toad (applies Weak, tiers 1–2),
  Hex Archer (applies Vulnerable, tiers 3–5).
- 2026-10-25 — Status effects: Vulnerable, Weak, Poison on player and enemies. `applyStatus` card effect,
  `debuff` enemy intent, shared `attackDamage` (strength → weak → vulnerable, round down), tappable status chips.
  Timing: Vuln/Weak lose 1 stack at end of round (after the enemy acts); stacks an enemy applied that round
  skip their first tick, so n = n turns where it matters for either side. Poison ticks at start of owner's turn.
- 2026-10-24 — Initial game: combat engine, 12 cards, 6 enemies, 5 fights + boss, rewards, saves, PWA, deployed.
