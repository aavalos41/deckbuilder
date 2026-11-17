import { CARDS, RARITY_WEIGHTS, REWARD_POOL, type RewardPool, type RewardRarity } from '../data/cards';
import { DEFAULT_LOADOUT, LOADOUT_KINDS, LOADOUTS } from '../data/loadouts';
import { BOSS_ID, ENCOUNTER_TIERS } from '../data/enemies';
import { RELIC_CHOICES, RELIC_FLOORS, RELICS } from '../data/relics';
import { fireRelics, noStatuses, startCombat } from './combat';
import { randomInt, shuffle, weightedIndex } from './rng';
import type { RunState } from './types';

export const PLAYER_MAX_HP = 70;
export const REWARD_CHOICES = 3;

export interface RunLoadout {
  /** Starter deck card ids: each source's starter cards, in source order. */
  deck: string[];
  /** Reward pool: neutral REWARD_POOL ∪ each source's cardPool, grouped by rarity. */
  pool: RewardPool;
  /** Passive relic ids granted at run start. */
  relics: string[];
}

/**
 * Merges the chosen loadout sources. Needs exactly one source per kind in `kinds`
 * (defaults to LOADOUT_KINDS); throws otherwise, since that's a bug, not a game state.
 */
export function buildRunLoadout(
  sourceIds: readonly string[],
  kinds: readonly string[] = LOADOUT_KINDS.map((k) => k.id),
): RunLoadout {
  const sources = sourceIds.map((id) => {
    const s = LOADOUTS[id];
    if (!s) throw new Error(`Unknown loadout source: ${id}`);
    return s;
  });
  for (const kind of kinds) {
    const n = sources.filter((s) => s.kind === kind).length;
    if (n !== 1) throw new Error(`Loadout needs exactly one '${kind}', got ${n}`);
  }
  if (sources.length !== kinds.length) throw new Error(`Loadout has sources of unknown kinds: ${sourceIds.join(', ')}`);

  const pool: RewardPool = { common: [...REWARD_POOL.common], uncommon: [...REWARD_POOL.uncommon], rare: [...REWARD_POOL.rare] };
  for (const s of sources) {
    for (const id of s.cardPool) {
      const rarity = CARDS[id].rarity;
      if (rarity !== 'starter' && !pool[rarity].includes(id)) pool[rarity].push(id);
    }
  }
  return {
    deck: sources.flatMap((s) => s.starterCards),
    pool,
    relics: sources.flatMap((s) => (s.passive ? [s.passive] : [])),
  };
}

/** Relic ids that are loadout passives; these are never offered as relic rewards. */
const PASSIVE_RELICS = new Set(Object.values(LOADOUTS).flatMap((l) => (l.passive ? [l.passive] : [])));

export function newRun(seed: number, sourceIds: readonly string[] = DEFAULT_LOADOUT): RunState {
  const loadout = buildRunLoadout(sourceIds);
  let rng = seed;
  const encounters: string[] = [];
  for (const tier of ENCOUNTER_TIERS) {
    let i: number;
    [i, rng] = randomInt(rng, tier.length);
    encounters.push(tier[i]);
  }
  encounters.push(BOSS_ID);

  const deck = loadout.deck.map((defId, i) => ({ uid: `c${i}`, defId }));
  const run: RunState = {
    version: 6,
    seed,
    loadout: [...sourceIds],
    rngState: rng,
    floor: 0,
    encounters,
    player: { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP, block: 0, strength: 0, statuses: noStatuses() },
    deck,
    nextUid: deck.length,
    phase: 'combat',
    combat: null,
    rewardOptions: [],
    relics: [...loadout.relics],
    relicOptions: [],
  };
  return startCombat(run, encounters[0]);
}

/**
 * Rolls `count` distinct reward cards. Each slot rolls a rarity by RARITY_WEIGHTS, then a random card
 * of that rarity not already offered. If that rarity is used up, falls back to the most common one left.
 */
export function rollRewards(seed: number, pool: RewardPool, count = REWARD_CHOICES): [string[], number] {
  let rng = seed;
  const rarities = (Object.keys(RARITY_WEIGHTS) as RewardRarity[])
    .sort((a, b) => RARITY_WEIGHTS[b] - RARITY_WEIGHTS[a]);
  const left: Record<RewardRarity, string[]> = {
    common: [...pool.common], uncommon: [...pool.uncommon], rare: [...pool.rare],
  };
  const picks: string[] = [];
  while (picks.length < count) {
    let r: number;
    [r, rng] = weightedIndex(rarities.map((k) => RARITY_WEIGHTS[k]), rng);
    const rarity = [rarities[r], ...rarities.filter((_, i) => i !== r)].find((k) => left[k].length > 0);
    if (!rarity) break; // pool exhausted
    let i: number;
    [i, rng] = randomInt(rng, left[rarity].length);
    picks.push(left[rarity].splice(i, 1)[0]);
  }
  return [picks, rng];
}

/** Call after combat.result changes. Moves the run to reward / victory / defeat. */
export function resolveCombat(prev: RunState): RunState {
  const c = prev.combat;
  if (!c || c.result === 'ongoing') return prev;
  const run = structuredClone(prev);

  if (c.result === 'lost') {
    run.phase = 'defeat';
    return run;
  }
  fireRelics(run, 'combatEnd');
  if (run.floor >= run.encounters.length - 1) {
    run.phase = 'victory';
    return run;
  }
  [run.rewardOptions, run.rngState] = rollRewards(run.rngState, buildRunLoadout(run.loadout).pool);
  run.phase = 'reward';
  if (RELIC_FLOORS.includes(run.floor)) {
    const unowned = Object.keys(RELICS).filter((id) => !run.relics.includes(id) && !PASSIVE_RELICS.has(id));
    if (unowned.length >= RELIC_CHOICES) {
      const [shuffled, rng] = shuffle(unowned, run.rngState);
      run.rngState = rng;
      run.relicOptions = shuffled.slice(0, RELIC_CHOICES);
      run.phase = 'relic';
    }
  }
  return run;
}

/** Take one of the offered relics, then go on to the card reward. */
export function chooseRelic(prev: RunState, relicId: string): RunState {
  if (prev.phase !== 'relic' || !prev.relicOptions.includes(relicId)) return prev;
  const run = structuredClone(prev);
  run.relics.push(relicId);
  run.relicOptions = [];
  run.phase = 'reward';
  return run;
}

/** Pick a reward card (or null to skip) and start the next fight. */
export function chooseReward(prev: RunState, defId: string | null): RunState {
  if (prev.phase !== 'reward') return prev;
  const run = structuredClone(prev);
  if (defId && run.rewardOptions.includes(defId)) {
    run.deck.push({ uid: `c${run.nextUid++}`, defId });
  }
  run.rewardOptions = [];
  run.floor++;
  run.phase = 'combat';
  return startCombat(run, run.encounters[run.floor]);
}
