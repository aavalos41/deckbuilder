import type { RunState } from './types';

const KEY = 'deckbuilder.run.v1';

export function saveRun(run: RunState | null): void {
  try {
    if (run) localStorage.setItem(KEY, JSON.stringify(run));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable — game still works, just without saves */
  }
}

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as RunState;
    return run.version === 1 ? run : null;
  } catch {
    return null;
  }
}
