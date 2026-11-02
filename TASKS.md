# Tasks

Work top to bottom. Each task should be one small, shippable change (tests + build pass, then push).
Move finished tasks to **Done** with the date. Add new ideas to **Backlog**.

## Up next

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
  Race is a small layer: a starter relic (reuses the relic system) + 1–2 starter card swaps (e.g. Dwarf: +block on first turn; Elf: draw 1 extra on turn 1).
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
