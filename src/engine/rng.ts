// Seeded PRNG (mulberry32). State is a single number so it serialises with the game state.
export function nextRandom(seed: number): [value: number, nextSeed: number] {
  let t = (seed + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), t | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return [value, t];
}

export function randomInt(seed: number, maxExclusive: number): [number, number] {
  const [v, next] = nextRandom(seed);
  return [Math.floor(v * maxExclusive), next];
}

/** Picks an index with probability proportional to its weight. Weights must be >= 0 with a positive sum. */
export function weightedIndex(weights: readonly number[], seed: number): [number, number] {
  const total = weights.reduce((a, b) => a + b, 0);
  const [v, next] = nextRandom(seed);
  let roll = v * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll < 0) return [i, next];
  }
  return [weights.length - 1, next];
}

export function shuffle<T>(items: readonly T[], seed: number): [T[], number] {
  const out = [...items];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    let j: number;
    [j, s] = randomInt(s, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return [out, s];
}

export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 32) >>> 0;
}
