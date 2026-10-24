# Deckbuilder — notes for Claude

A minimal roguelike deck builder. Hobby/learning project by Alf, mostly worked on from an Android phone
via Claude Code, so keep changes small, self-contained and easy to review on a small screen.

Live: https://deckbuilder.madebyalf.dev (Cloudflare Pages, auto-deploys on push to `main`).

## Stack
TypeScript + React 18 + Vite. Plain CSS. Vitest for tests. PWA (manifest + tiny service worker in `public/`).
No other runtime dependencies — ask before adding one.

## Architecture (keep it this way)
- `src/engine/` — **pure TypeScript game logic, no React, no DOM.** Every action is a pure function
  `(state, ...args) => newState`. State is plain JSON (see `types.ts`) so it saves/loads trivially.
- `src/data/` — content as data: `cards.ts`, `enemies.ts`. Adding content should mostly mean adding data here.
- `src/ui/` — React components that render state and call engine functions. No game rules in the UI.
- Randomness only via `engine/rng.ts` using `run.rngState` (seeded). Never call `Math.random()` in the engine.

## Adding things
- **New card:** add to `CARDS` in `src/data/cards.ts` using existing `Effect` types.
- **New effect type:** add to the `Effect` union in `types.ts`, handle it in `applyEffect` in `combat.ts`, add a test.
- **New enemy:** add to `ENEMIES` and to a tier in `ENCOUNTER_TIERS`.
- If `RunState` changes shape, bump `version` in `types.ts` and `save.ts` (old saves are discarded).

## Workflow
- Run `npm test` and `npm run build` before committing; both must pass.
- Small commits with clear messages. Push to `main` deploys to production.
- UI is portrait-phone-first: test at ~380px wide. Tap targets ≥ 44px.

## Roadmap (rough order)
1. Status effects (vulnerable, weak, poison) + player strength cards
2. Relics
3. Branching map (fights, elites, rest sites, shop)
4. Card upgrades
5. More characters
