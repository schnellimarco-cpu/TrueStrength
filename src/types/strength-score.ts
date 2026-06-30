export type ExerciseStrengthScore = {
  exerciseName: string;
  bestEstimatedOneRepMax: number;
  bodyweightUsed: number;
  relativeStrengthScore: number;
  calculatedAt: string;
};

export type StrengthScoreSnapshot = {
  generatedAt: string;
  formula: 'dots';
  overallScore: number | null;
  exerciseScores: ExerciseStrengthScore[]; // sorted desc by relativeStrengthScore
  validExerciseCount: number;
  excludedExerciseCount: number;
  missingBodyweight: boolean;
};
