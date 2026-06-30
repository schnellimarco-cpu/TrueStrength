import { calculateDOTS } from './formulas/dots';
import type { StrengthMetrics, BodyweightMetrics } from '@/types/analytics';
import type { ExerciseStrengthScore, StrengthScoreSnapshot } from '@/types/strength-score';

export function computeStrengthScoreSnapshot(
  strength: StrengthMetrics,
  bodyweight: BodyweightMetrics,
  generatedAt: string
): StrengthScoreSnapshot {
  if (!bodyweight.currentEntry) {
    return {
      generatedAt,
      formula: 'dots',
      overallScore: null,
      exerciseScores: [],
      validExerciseCount: 0,
      excludedExerciseCount: strength.exerciseBests.length,
      missingBodyweight: true,
    };
  }

  const fallbackBW = bodyweight.currentEntry.weightKg;
  const scores: ExerciseStrengthScore[] = [];
  let excluded = 0;

  for (const ex of strength.exerciseBests) {
    if (!ex.bestEstimated1RM || ex.bestEstimated1RM <= 0) {
      excluded++;
      continue;
    }

    // Use bodyweight closest to when the PR was set; fall back to current entry
    const bw = ex.bestSetDate
      ? (bodyweight.workoutDateWeightMap[ex.bestSetDate] ?? fallbackBW)
      : fallbackBW;

    const score = calculateDOTS({ estimatedOneRepMax: ex.bestEstimated1RM, bodyweightKg: bw });
    if (score <= 0) {
      excluded++;
      continue;
    }

    scores.push({
      exerciseName: ex.exerciseName,
      bestEstimatedOneRepMax: ex.bestEstimated1RM,
      bodyweightUsed: bw,
      relativeStrengthScore: Math.round(score * 10) / 10,
      calculatedAt: generatedAt,
    });
  }

  scores.sort((a, b) => b.relativeStrengthScore - a.relativeStrengthScore);

  const overallScore =
    scores.length > 0
      ? Math.round(
          (scores.reduce((sum, s) => sum + s.relativeStrengthScore, 0) / scores.length) * 10
        ) / 10
      : null;

  return {
    generatedAt,
    formula: 'dots',
    overallScore,
    exerciseScores: scores,
    validExerciseCount: scores.length,
    excludedExerciseCount: excluded,
    missingBodyweight: false,
  };
}
