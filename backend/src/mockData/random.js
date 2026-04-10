function hashSeed(input) {
  const text = String(input ?? "42");
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRng(seed) {
  let state = hashSeed(seed);

  return {
    next() {
      state += 0x6d2b79f5;
      let result = state;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    },
  };
}

function randomInt(rng, min, max) {
  return Math.floor(rng.next() * (max - min + 1)) + min;
}

function randomFloat(rng, min, max, decimals = 2) {
  const factor = 10 ** decimals;
  const value = min + rng.next() * (max - min);
  return Math.round(value * factor) / factor;
}

function randomChance(rng, probability) {
  return rng.next() < probability;
}

function pickOne(rng, items) {
  return items[randomInt(rng, 0, items.length - 1)];
}

function shuffle(rng, items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(rng, 0, index);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function weightedPick(rng, items, getWeight = (item) => item.weight || 1) {
  const total = items.reduce((sum, item) => sum + Math.max(0, getWeight(item)), 0);
  if (total <= 0) {
    return items[0];
  }

  let threshold = rng.next() * total;
  for (const item of items) {
    threshold -= Math.max(0, getWeight(item));
    if (threshold <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

function sampleWeightedUnique(rng, items, count, getWeight = (item) => item.weight || 1) {
  const pool = [...items];
  const selected = [];

  while (pool.length > 0 && selected.length < count) {
    const item = weightedPick(rng, pool, getWeight);
    selected.push(item);
    const index = pool.indexOf(item);
    pool.splice(index, 1);
  }

  return selected;
}

module.exports = {
  createRng,
  pickOne,
  randomChance,
  randomFloat,
  randomInt,
  sampleWeightedUnique,
  shuffle,
  weightedPick,
};
