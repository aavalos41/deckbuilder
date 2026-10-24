# Deckbuilder

A minimal roguelike deck builder that runs in the browser and installs on your phone as a PWA.

**Play:** https://deckbuilder.madebyalf.dev

Five fights and a boss. Start with a 10-card deck, pick a new card after each win, and see if you can beat the Gatekeeper.

## Develop

```bash
npm install
npm run dev     # local dev server (also on your LAN, so you can open it on your phone)
npm test        # engine tests
npm run build   # production build to dist/
```

## How it's put together

- `src/engine/` – game rules as pure TypeScript functions over plain JSON state
- `src/data/` – cards and enemies as data
- `src/ui/` – React components

Runs are seeded, so the same seed gives the same encounters and shuffles.
