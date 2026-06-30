export type CoachRecommendation = {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'strength' | 'volume' | 'recovery' | 'consistency' | 'bodyweight' | 'personal_record';
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
};
