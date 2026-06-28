export type CalendarDayState = 'planned' | 'completed' | 'active' | 'rest' | 'today';

export type CalendarDay = {
  date: string;
  state: CalendarDayState;
  splitDayId?: string;
  splitDayName?: string;
  muscleGroups?: string[];
  workoutId?: string;
  workoutTitle?: string;
};

export type UpcomingWorkout = {
  date: string;
  splitDayId: string;
  splitDayName: string;
  muscleGroups: string[];
  isToday: boolean;
};
