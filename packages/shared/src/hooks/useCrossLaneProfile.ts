import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useDocument, useCollection } from './useFirestore';
import { where } from 'firebase/firestore';
import type { User, Goal, UserProgress, JournalEntry, Achievement, Post, Lane } from '../types';
import type { DocumentData } from 'firebase/firestore';

// --- Types ---

type ReentryData = NonNullable<User['reentry']>;

interface Lane1Profile {
  readonly enrollmentStatus: ReentryData['enrollmentStatus'] | null;
  readonly caseManagerId: string | null;
  readonly goalsTotal: number;
  readonly goalsCompleted: number;
  readonly goalsProgress: number;
  readonly employmentStatus: 'seeking' | 'interviewing' | 'employed' | 'none';
}

interface Lane2Profile {
  readonly currentStep: number;
  readonly completedStepsCount: number;
  readonly journalEntriesCount: number;
  readonly achievements: ReadonlyArray<Achievement>;
}

interface Lane3Profile {
  readonly postsCount: number;
  readonly storiesShared: number;
  readonly connectionsCount: number;
}

export interface CrossLaneProfile {
  readonly userId: string;
  readonly displayName: string;
  readonly lanes: ReadonlyArray<Lane>;
  readonly lane1: Lane1Profile;
  readonly lane2: Lane2Profile;
  readonly lane3: Lane3Profile;
}

export interface UseCrossLaneProfileResult {
  readonly profile: CrossLaneProfile | null;
  readonly loading: boolean;
  readonly error: Error | null;
}

// --- Helpers ---

function deriveLane1Profile(
  user: User | null,
  goals: ReadonlyArray<Goal>,
  jobApps: ReadonlyArray<DocumentData>
): Lane1Profile {
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const totalGoals = goals.length;
  const progressSum = goals.reduce((sum, g) => sum + g.progress, 0);
  const avgProgress = totalGoals > 0 ? Math.round(progressSum / totalGoals) : 0;

  const hasAccepted = jobApps.some((j) => j.status === 'accepted');
  const hasInterviewing = jobApps.some((j) => j.status === 'interviewing');
  const hasSaved = jobApps.some((j) => j.status === 'saved' || j.status === 'applied');
  const employmentStatus = hasAccepted
    ? 'employed' as const
    : hasInterviewing
      ? 'interviewing' as const
      : hasSaved
        ? 'seeking' as const
        : 'none' as const;

  return {
    enrollmentStatus: user?.reentry?.enrollmentStatus ?? null,
    caseManagerId: user?.reentry?.caseManagerId ?? null,
    goalsTotal: totalGoals,
    goalsCompleted: completedGoals,
    goalsProgress: avgProgress,
    employmentStatus,
  };
}

function deriveLane2Profile(
  user: User | null,
  progress: ReadonlyArray<UserProgress>,
  journals: ReadonlyArray<JournalEntry>,
  achievements: ReadonlyArray<Achievement>
): Lane2Profile {
  const completedSteps = new Set(
    progress.filter((p) => p.status === 'completed').map((p) => p.courseId)
  );

  return {
    currentStep: user?.stepExperience?.currentStep ?? 0,
    completedStepsCount: completedSteps.size,
    journalEntriesCount: journals.length,
    achievements: [...achievements],
  };
}

function deriveLane3Profile(
  posts: ReadonlyArray<Post>,
  mentorMatches: ReadonlyArray<DocumentData>
): Lane3Profile {
  const stories = posts.filter((p) => p.type === 'story').length;
  const activeConnections = mentorMatches.filter(
    (m) => m.status === 'active' || m.status === 'trial'
  ).length;

  return {
    postsCount: posts.length,
    storiesShared: stories,
    connectionsCount: activeConnections,
  };
}

// --- Hook ---

export function useCrossLaneProfile(): UseCrossLaneProfileResult {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  const { data: user, loading: userLoading, error: userError } = useDocument<User>('users', uid);

  const userConstraints = uid ? [where('userId', '==', uid)] : [];
  const authorConstraints = uid ? [where('authorId', '==', uid)] : [];

  const { data: goals, loading: goalsLoading } = useCollection<Goal>('goals', ...userConstraints);
  const { data: jobApps, loading: jobsLoading } = useCollection<DocumentData>('jobApplications', ...userConstraints);
  const { data: progress, loading: progressLoading } = useCollection<UserProgress>('userProgress', ...userConstraints);
  const { data: journals, loading: journalsLoading } = useCollection<JournalEntry>('journalEntries', ...userConstraints);
  const { data: achievements, loading: achievementsLoading } = useCollection<Achievement>('achievements', ...userConstraints);
  const { data: posts, loading: postsLoading } = useCollection<Post>('posts', ...authorConstraints);

  const mentorConstraints = uid ? [where('menteeId', '==', uid)] : [];
  const { data: mentorMatches, loading: mentorLoading } = useCollection<DocumentData>('mentorMatches', ...mentorConstraints);

  const loading =
    userLoading || goalsLoading || jobsLoading || progressLoading ||
    journalsLoading || achievementsLoading || postsLoading || mentorLoading;

  const profile = useMemo<CrossLaneProfile | null>(() => {
    if (!uid || !user) return null;

    return {
      userId: uid,
      displayName: user.displayName,
      lanes: [...(user.lanes ?? [])],
      lane1: deriveLane1Profile(user, goals, jobApps),
      lane2: deriveLane2Profile(user, progress, journals, achievements),
      lane3: deriveLane3Profile(posts, mentorMatches),
    };
  }, [uid, user, goals, jobApps, progress, journals, achievements, posts, mentorMatches]);

  return { profile, loading, error: userError };
}
