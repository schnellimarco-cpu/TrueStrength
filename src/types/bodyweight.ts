export type WeightUnit = 'kg' | 'lbs';

export type BodyweightEntry = {
  id: string;
  userId: string;
  weightKg: number;
  unit: WeightUnit;
  measuredAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBodyweightEntryInput = {
  weightKg: number;
  unit: WeightUnit;
  measuredAt: string; // YYYY-MM-DD
};

export type UpdateBodyweightEntryInput = {
  weightKg?: number;
  unit?: WeightUnit;
  measuredAt?: string; // YYYY-MM-DD
};
