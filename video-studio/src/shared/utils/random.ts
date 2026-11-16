import { random } from "remotion";

/** Deterministic random number in [min, max). Same seed → same result every render. */
export const rand = (seed: string | number, min = 0, max = 1): number =>
  min + random(seed) * (max - min);
