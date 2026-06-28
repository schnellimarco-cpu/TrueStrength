import { HomeHeader } from '@/components/home/header';
import { StrengthScoreCard } from '@/components/home/strength-score-card';
import { TodayWorkoutCard } from '@/components/home/today-workout-card';
import { WeeklyProgressCard } from '@/components/home/weekly-progress-card';
import { RecoveryStreakRow } from '@/components/home/recovery-streak-row';
import { CoachReportCard } from '@/components/home/coach-report-card';
import { QuickActions } from '@/components/home/quick-actions';
import { ScreenContainer } from '@/components/ui';
import { Spacing } from '@/constants/theme';

const DATA = {
  userName: 'Marco',
  strengthScore: {
    value: 126,
    weeklyChange: '+2.4',
    ninetyDayChange: '+14',
    personalBest: 'New High Score',
    trend: 'Improving this week',
  },
  todayWorkout: { name: 'Push Day', focus: 'Chest, Shoulders, Triceps', duration: '60 min' },
  weeklyProgress: { completed: 3, total: 4 },
  recovery: { status: 'Ready', message: 'You are good to train today' },
  streak: { current: 12, best: 21 },
  coachReport: {
    grade: 'B+',
    recommendation:
      'Your upper body strength is improving. Keep volume stable and focus on recovery.',
  },
} as const;

export default function HomeScreen() {
  return (
    <ScreenContainer
      scrollable
      contentStyle={{ gap: Spacing.three, paddingBottom: Spacing.five }}>
      <HomeHeader name={DATA.userName} />
      <StrengthScoreCard
        value={DATA.strengthScore.value}
        weeklyChange={DATA.strengthScore.weeklyChange}
        ninetyDayChange={DATA.strengthScore.ninetyDayChange}
        personalBest={DATA.strengthScore.personalBest}
        trend={DATA.strengthScore.trend}
      />
      <TodayWorkoutCard
        name={DATA.todayWorkout.name}
        focus={DATA.todayWorkout.focus}
        duration={DATA.todayWorkout.duration}
        onStart={() => {}}
      />
      <WeeklyProgressCard
        completed={DATA.weeklyProgress.completed}
        total={DATA.weeklyProgress.total}
      />
      <RecoveryStreakRow
        recovery={DATA.recovery}
        streak={DATA.streak}
      />
      <CoachReportCard
        grade={DATA.coachReport.grade}
        recommendation={DATA.coachReport.recommendation}
        onViewReport={() => {}}
      />
      <QuickActions
        onStartWorkout={() => {}}
        onLogWeight={() => {}}
        onViewProgress={() => {}}
      />
    </ScreenContainer>
  );
}
