import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useDocument, useCollection } from './useFirestore';
import { where } from 'firebase/firestore';
import type { User, Goal, UserProgress, Achievement, AchievementType, Lane } from '../types';

// --- Types ---

interface LaneProgress {
  readonly percentage: number;
  readonly completedItems: number;
  readonly totalItems: number;
}

interface AchievementMilestone {
  readonly type: AchievementType;
  readonly title: string;
  readonly earnedAt: Achievement['earnedAt'];
  readonly sourceLane: Lane;
}

export interface CrossLaneProgress {
  readonly overall: number;
  readonly lane1: LaneProgress;
  readonly lane2: LaneProgress;
  readonly lane3: LaneProgress;
  readonly recentAchievements: ReadonlyArray<AchievementMilestone>;
  readonly stepToGoalSync: ReadonlyArray<StepGoalLink>;
}

interface StepGoalLink {
  readonly stepNumber: number;
  readonly stepCompleted: boolean;
  readonly linkedGoalId: string | null;
  readonly goalProgress: number;
}

export interface UseCrossLaneProgressResult {
  readonly progress: CrossLaneProgress | null;
  readonly loading: boolean;
}

// --- Constants ---

const TOTAL_STEPS = 12;
const LANE_WEIGHT = 1 / 3;

const ACHIEVEMENT_LANE_MAP: Readonly<Record<AchievementType, Lane>> = {
  sobriety_milestone: 'lane1',
  employment: 'lane1',
  housing: 'lane1',
  financial: 'lane1',
  step_completion: 'lane2',
  course_completion: 'lane2',
  streak: 'lane2',
  community: 'lane3',
};

// --- Helpers ---

function computeLane1Progress(goals: ReadonlyArray<Goal>): LaneProgress {
  if (goals.length === 0) {
    return { percentage: 0, completedItems: 0, totalItems: 0 };
  }
  const completed = goals.filter((g) => g.status === 'completed').length;
  const percentage = Math.round((completed / goals.length) * 100);
  return { percentage, completedItems: completed, totalItems: goals.length };
}

function computeLane2Progress(
  userProgress: ReadonlyArray<UserProgress>,
  user: User | null
): LaneProgress {
  const completedCourses = new Set(
    userProgress.filter((p) => p.status === 'completed').map((p) => p.courseId)
  );
  const currentStep = user?.stepExperience?.currentStep ?? 1;
  const totalItems = Math.max(TOTAL_STEPS, currentStep);
  const completedItems = completedCourses.size;
  const percentage = Math.round((completedItems / totalItems) * 100);
  return { percentage, completedItems, totalItems };
}

function computeLane3Progress(achievements: ReadonlyArray<Achievement>): LaneProgress {
  const communityAchievements = achievements.filter((a) => a.type === 'community');
  // Community milestones: 5 tiers (bronze, silver, gold, platinum, beyond)
  const totalMilestones = 5;
  const completedItems = Math.min(communityAchievements.length, totalMilestones);
  const percentage = Math.round((completedItems / totalMilestones) * 100);
  return { percentage, completedItems, totalItems: totalMilestones };
}

function buildStepGoalLinks(
  userProgress: ReadonlyArray<UserProgress>,
  goals: ReadonlyArray<Goal>
): ReadonlyArray<StepGoalLink> {
  const completedCourseIds = new Set(
    userProgress.filter((p) => p.status === 'completed').map((p) => p.courseId)
  );

  return Array.from({ length: TOTAL_STEPS }, (_, i) => {
    const stepNumber = i + 1;
    const courseId = `step-${stepNumber}`;
    const stepCompleted = completedCourseIds.has(courseId);

    const linkedGoal = goals.find(
      (g) => g.category === 'personal' && g.title.toLowerCase().includes(`step ${stepNumber}`)
    );

    return {
      stepNumber,
      stepCompleted,
      linkedGoalId: linkedGoal?.id ?? null,
      goalProgress: linkedGoal?.progress ?? 0,
    };
  });
}

function buildRecentAchievements(
  achievements: ReadonlyArray<Achievement>
): ReadonlyArray<AchievementMilestone> {
  const sorted = [...achievements].sort((a, b) => {
    const aTime = a.earnedAt?.toMillis?.() ?? 0;
    const bTime = b.earnedAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });

  return sorted.slice(0, 10).map((a) => ({
    type: a.type,
    title: a.title,
    earnedAt: a.earnedAt,
    sourceLane: ACHIEVEMENT_LANE_MAP[a.type] ?? 'lane1',
  }));
}

// --- Hook ---

export function useCrossLaneProgress(): UseCrossLaneProgressResult {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  const { data: user, loading: userLoading } = useDocument<User>('users', uid);

  const userConstraints = uid ? [where('userId', '==', uid)] : [];
  const { data: goals, loading: goalsLoading } = useCollection<Goal>('goals', ...userConstraints);
  const { data: userProgress, loading: progressLoading } = useCollection<UserProgress>('userProgress', ...userConstraints);
  const { data: achievements, loading: achievementsLoading } = useCollection<Achievement>('achievements', ...userConstraints);

  const loading = userLoading || goalsLoading || progressLoading || achievementsLoading;

  const progress = useMemo<CrossLaneProgress | null>(() => {
    if (!uid) return null;

    const lane1 = computeLane1Progress(goals);
    const lane2 = computeLane2Progress(userProgress, user);
    const lane3 = computeLane3Progress(achievements);

    const overall = Math.round(
      lane1.percentage * LANE_WEIGHT +
      lane2.percentage * LANE_WEIGHT +
      lane3.percentage * LANE_WEIGHT
    );

    return {
      overall,
      lane1,
      lane2,
      lane3,
      recentAchievements: buildRecentAchievements(achievements),
      stepToGoalSync: buildStepGoalLinks(userProgress, goals),
    };
  }, [uid, user, goals, userProgress, achievements]);

  return { progress, loading };
}
