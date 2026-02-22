import { useState, useMemo, useCallback } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  useAuth,
  useCollection,
  toDate,
  formatDate,
  AchievementBadge,
} from '@reprieve/shared';
import type { BadgeData } from '@reprieve/shared';
import type { Achievement } from '@reprieve/shared';
import {
  ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENT_CATEGORIES,
  CATEGORY_LABELS,
} from '@reprieve/shared/utils/achievements';
import type { AchievementCategory } from '@reprieve/shared/utils/achievements';
import { where, orderBy } from 'firebase/firestore';
import {
  Trophy,
  Star,
  Filter,
  X,
  Share2,
  Lock,
  Sparkles,
} from 'lucide-react';

// ── Filter Tab Type ─────────────────────────────────────────────────────────

type FilterTab = 'all' | AchievementCategory;

const FILTER_TABS: readonly { readonly value: FilterTab; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  ...ACHIEVEMENT_CATEGORIES.map((cat) => ({
    value: cat as FilterTab,
    label: CATEGORY_LABELS[cat],
  })),
] as const;

// ── Loading Skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 bg-stone-100 rounded-xl" />
      <div className="h-10 bg-stone-100 rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 bg-stone-100 rounded-full" />
            <div className="h-3 w-14 bg-stone-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Badge Detail Modal ──────────────────────────────────────────────────────

interface BadgeModalProps {
  readonly badge: BadgeData;
  readonly earned: boolean;
  readonly earnedAchievement: Achievement | undefined;
  readonly onClose: () => void;
  readonly onShare: (badge: BadgeData) => void;
}

function BadgeDetailModal({ badge, earned, earnedAchievement, onClose, onShare }: BadgeModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${badge.title} details`}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 p-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white text-stone-500"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div
            className={`h-20 w-20 mx-auto rounded-full flex items-center justify-center mb-3 ${
              earned
                ? 'bg-amber-100 border-2 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                : 'bg-stone-100 border-2 border-stone-200 grayscale'
            }`}
          >
            {earned ? (
              <span className="text-4xl">{badge.icon}</span>
            ) : (
              <Lock className="h-8 w-8 text-stone-300" />
            )}
          </div>

          <h3 className="text-lg font-bold text-stone-800">{badge.title}</h3>
          <p className="text-sm text-stone-500 mt-1">{badge.description}</p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Category
            </span>
            <Badge variant="secondary">
              {CATEGORY_LABELS[badge.category]}
            </Badge>
          </div>

          {earned && earnedAchievement && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                Earned
              </span>
              <span className="text-sm font-medium text-amber-700">
                {formatDate(earnedAchievement.earnedAt)}
              </span>
            </div>
          )}

          {!earned && (
            <div className="bg-stone-50 rounded-lg p-3 text-center">
              <Lock className="h-5 w-5 text-stone-300 mx-auto mb-1" />
              <p className="text-xs text-stone-500">
                Keep making progress to unlock this achievement!
              </p>
            </div>
          )}

          {earned && (
            <Button
              onClick={() => onShare(badge)}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share to Community
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function Achievements() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);

  // Fetch user's earned achievements from Firestore
  const { data: achievements, loading } = useCollection<Achievement>(
    'achievements',
    where('userId', '==', uid ?? ''),
    orderBy('earnedAt', 'desc')
  );

  // Build a set of earned achievement IDs for fast lookup
  const earnedMap = useMemo(() => {
    const map = new Map<string, Achievement>();
    if (achievements) {
      for (const a of achievements) {
        map.set(a.id, a);
      }
    }
    return map;
  }, [achievements]);

  const earnedCount = earnedMap.size;
  const totalCount = ACHIEVEMENT_DEFINITIONS.length;
  const progressPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  // Filter definitions by active tab
  const filteredDefinitions = useMemo(() => {
    if (activeFilter === 'all') return ACHIEVEMENT_DEFINITIONS;
    return ACHIEVEMENT_DEFINITIONS.filter((d) => d.category === activeFilter);
  }, [activeFilter]);

  // Convert a definition into BadgeData for the AchievementBadge component
  const toBadgeData = useCallback(
    (def: typeof ACHIEVEMENT_DEFINITIONS[number]): BadgeData => {
      const earnedAchievement = earnedMap.get(def.id);
      const earnedAt = earnedAchievement
        ? toDate(earnedAchievement.earnedAt) ?? undefined
        : undefined;

      return {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        category: def.category,
        earnedAt: earnedAt ?? null,
        locked: !earnedAchievement,
      };
    },
    [earnedMap]
  );

  // Handle badge selection (open detail modal)
  const handleBadgeSelect = useCallback((badge: BadgeData) => {
    setSelectedBadge(badge);
  }, []);

  // Handle share to Lane 3 community feed
  const handleShare = useCallback((badge: BadgeData) => {
    // Placeholder: in production, post to Lane 3 social feed via setDocument
    console.log('Share achievement to Lane 3 community:', badge.title);
    setSelectedBadge(null);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageContainer title="Achievements" subtitle="Celebrate your milestones">
        <LoadingSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Achievements" subtitle="Celebrate your milestones">
      {/* Progress Summary Card */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-stone-50 border-0">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Trophy className="h-7 w-7 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-500 font-medium">Your Progress</p>
              <p className="text-2xl font-bold text-stone-800">
                {earnedCount}{' '}
                <span className="text-base font-normal text-stone-500">
                  of {totalCount} achievements
                </span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-lg font-bold text-amber-700">{progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-3 bg-stone-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-stone-400">
              <span>Getting started</span>
              <span>Journey complete</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 pb-1">
        <div className="flex gap-2">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.value;
            // Count earned in this category
            const catCount =
              tab.value === 'all'
                ? earnedCount
                : ACHIEVEMENT_DEFINITIONS.filter(
                    (d) => d.category === tab.value && earnedMap.has(d.id)
                  ).length;
            const catTotal =
              tab.value === 'all'
                ? totalCount
                : ACHIEVEMENT_DEFINITIONS.filter((d) => d.category === tab.value).length;

            return (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] ${
                    isActive ? 'text-amber-200' : 'text-stone-400'
                  }`}
                >
                  {catCount}/{catTotal}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {filteredDefinitions.map((def) => {
          const badgeData = toBadgeData(def);
          return (
            <AchievementBadge
              key={def.id}
              badge={badgeData}
              onSelect={handleBadgeSelect}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {filteredDefinitions.length === 0 && (
        <Card className="border-dashed border-stone-300">
          <CardContent className="p-8 text-center">
            <Filter className="h-8 w-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm text-stone-500">
              No achievements in this category yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Motivational Footer */}
      {earnedCount === 0 && (
        <Card className="bg-gradient-to-br from-stone-50 to-amber-50 border-0">
          <CardContent className="p-5 text-center">
            <Star className="h-8 w-8 text-amber-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-stone-700 mb-1">
              Your journey starts here
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
              Complete daily check-ins, work through the steps, and engage with the community
              to earn achievements and celebrate your progress.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          earned={!selectedBadge.locked}
          earnedAchievement={earnedMap.get(selectedBadge.id)}
          onClose={() => setSelectedBadge(null)}
          onShare={handleShare}
        />
      )}
    </PageContainer>
  );
}
