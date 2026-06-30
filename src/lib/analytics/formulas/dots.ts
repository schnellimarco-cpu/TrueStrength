// DOTS relative strength formula (Jansen, 2020).
// Produces a score normalized by bodyweight — higher = stronger relative to bodyweight.
//
// This module is the single source of truth for DOTS. To swap the formula later,
// replace calculateDOTS or add a new formula file and change the import in strength-score.ts.
//
// When sex is unknown, male coefficients are used (conservative — slightly lower scores
// than female coefficients). Once a user profile provides sex, pass it through.

const MALE = {
  a: -307.75076,
  b: 24.0900756,
  c: -0.1918759221,
  d: 0.0007391293,
  e: -0.0000010938,
};

const FEMALE = {
  a: -57.96288,
  b: 13.6175032,
  c: -0.1126655495,
  d: 0.0005158568,
  e: -0.0000010000,
};

export type DOTSInput = {
  estimatedOneRepMax: number;
  bodyweightKg: number;
  sex?: 'male' | 'female';
};

export function calculateDOTS({ estimatedOneRepMax, bodyweightKg, sex }: DOTSInput): number {
  if (estimatedOneRepMax <= 0 || bodyweightKg <= 0) return 0;
  const c = sex === 'female' ? FEMALE : MALE;
  const bw = bodyweightKg;
  const denom = c.a + c.b * bw + c.c * bw ** 2 + c.d * bw ** 3 + c.e * bw ** 4;
  if (denom <= 0) return 0;
  const score = (500 / denom) * estimatedOneRepMax;
  return isFinite(score) && !isNaN(score) ? score : 0;
}
