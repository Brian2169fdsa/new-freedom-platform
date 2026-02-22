import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useCollection } from './useFirestore';
import { where, orderBy, limit } from 'firebase/firestore';
import type {
  Goal,
  UserProgress,
  Achievement,
  Post,
  JournalEntry,
  Lane,
} from '../types';
import type { Timestamp } from 'firebase/firestore';

// --- Types ---

export type ActivityType =
  | 'goal_created'
  | 'goal_completed'
  | 'step_completed'
  | 'journal_entry'
  | 'achievement_earned'
  | 'post_created'
  | 'story_shared';

export interface ActivityFeedItem {
  readonly id: string;
  readonly type: ActivityType;
  readonly title: string;
  readonly description: string;
  readonly timestamp: Timestamp;
  readonly sourceLane: Lane;
  readonly link: string;
}

export interface UseActivityFeedResult {
  readonly activities: ReadonlyArray<ActivityFeedItem>;
  readonly loading: boolean;
}

// --- Constants ---

const FEED_LIMIT = 20;
const QUERY_LIMIT = 20;

// --- Mappers ---

function mapGoalsToActivities(goals: ReadonlyArray<Goal>): ReadonlyArray<ActivityFeedItem> {
  return goals.map((goal) => {
    const isCompleted = goal.status === 'completed';
    return {
      id: `goal-${goal.id}`,
      type: isCompleted ? 'goal_completed' as const : 'goal_created' as const,
      title: isCompleted ? 'Goal Completed' : 'New Goal Set',
      description: goal.title,
      timestamp: goal.updatedAt,
      sourceLane: 'lane1' as const,
      link: `/reentry/goals/${goal.id}`,
    };
  });
}

function mapProgressToActivities(
  progress: ReadonlyArray<UserProgress>
): ReadonlyArray<ActivityFeedItem> {
  return progress
    .filter((p) => p.status === 'completed' && p.completedAt != null)
    .map((p) => ({
      id: `progress-${p.id}`,
      type: 'step_completed' as const,
      title: 'Step Module Completed',
      description: `Completed module in course ${p.courseId}`,
      timestamp: p.completedAt!,
      sourceLane: 'lane2' as const,
      link: `/steps/${p.courseId}`,
    }));
}

function mapJournalsToActivities(
  journals: ReadonlyArray<JournalEntry>
): ReadonlyArray<ActivityFeedItem> {
  return journals.map((j) => ({
    id: `journal-${j.id}`,
    type: 'journal_entry' as const,
    title: 'Journal Entry',
    description: j.relatedStep != null
      ? `Reflection for Step ${j.relatedStep}`
      : `Mood: ${j.mood}`,
    timestamp: j.date,
    sourceLane: 'lane2' as const,
    link: `/steps/journal/${j.id}`,
  }));
}

function mapAchievementsToActivities(
  achievements: ReadonlyArray<Achievement>
): ReadonlyArray<ActivityFeedItem> {
  return achievements.map((a) => ({
    id: `achievement-${a.id}`,
    type: 'achievement_earned' as const,
    title: 'Achievement Earned',
    description: a.title,
    timestamp: a.earnedAt,
    sourceLane: 'lane2' as const,
    link: `/achievements/${a.id}`,
  }));
}

function mapPostsToActivities(posts: ReadonlyArray<Post>): ReadonlyArray<ActivityFeedItem> {
  return posts.map((p) => ({
    id: `post-${p.id}`,
    type: p.type === 'story' ? 'story_shared' as const : 'post_created' as const,
    title: p.type === 'story' ? 'Story Shared' : 'New Post',
    description: p.content.length > 80
      ? `${p.content.slice(0, 77)}...`
      : p.content,
    timestamp: p.createdAt,
    sourceLane: 'lane3' as const,
    link: `/community/posts/${p.id}`,
  }));
}

function sortByTimestampDesc(
  items: ReadonlyArray<ActivityFeedItem>
): ReadonlyArray<ActivityFeedItem> {
  return [...items].sort((a, b) => {
    const aTime = a.timestamp?.toMillis?.() ?? 0;
    const bTime = b.timestamp?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

// --- Hook ---

export function useActivityFeed(): UseActivityFeedResult {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  const userConstraints = uid
    ? [where('userId', '==', uid), orderBy('updatedAt', 'desc'), limit(QUERY_LIMIT)]
    : [];
  const userCreatedAtConstraints = uid
    ? [where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(QUERY_LIMIT)]
    : [];
  const authorConstraints = uid
    ? [where('authorId', '==', uid), orderBy('createdAt', 'desc'), limit(QUERY_LIMIT)]
    : [];
  const journalConstraints = uid
    ? [where('userId', '==', uid), orderBy('date', 'desc'), limit(QUERY_LIMIT)]
    : [];

  const { data: goals, loading: goalsLoading } = useCollection<Goal>(
    'goals', ...userConstraints
  );
  const { data: progress, loading: progressLoading } = useCollection<UserProgress>(
    'userProgress', ...userCreatedAtConstraints
  );
  const { data: journals, loading: journalsLoading } = useCollection<JournalEntry>(
    'journalEntries', ...journalConstraints
  );
  const { data: achievements, loading: achievementsLoading } = useCollection<Achievement>(
    'achievements', ...userCreatedAtConstraints
  );
  const { data: posts, loading: postsLoading } = useCollection<Post>(
    'posts', ...authorConstraints
  );

  const loading =
    goalsLoading || progressLoading || journalsLoading ||
    achievementsLoading || postsLoading;

  const activities = useMemo<ReadonlyArray<ActivityFeedItem>>(() => {
    const allItems = [
      ...mapGoalsToActivities(goals),
      ...mapProgressToActivities(progress),
      ...mapJournalsToActivities(journals),
      ...mapAchievementsToActivities(achievements),
      ...mapPostsToActivities(posts),
    ];

    return sortByTimestampDesc(allItems).slice(0, FEED_LIMIT);
  }, [goals, progress, journals, achievements, posts]);

  return { activities, loading };
}
