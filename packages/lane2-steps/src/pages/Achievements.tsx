import { useState, useMemo } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  useAuth,
  useCollection,
  toDate,
  formatDate,
} from '@reprieve/shared';
import { where, orderBy, limit } from 'firebase/firestore';
import type { Achievement, AchievementType } from '@reprieve/shared';
import {
  Trophy,
  Star,
  Flame,
  BookOpen,
  Users,
  Calendar,
  Share2,
  Lock,
  Crown,
  Sparkles,
  Medal,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// All badge definitions
interface BadgeDefinition {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  category: string;
  hint: string;
}

const ALL_BADGES: BadgeDefinition[] = [
  // Sobriety Milestones
  { id: 'sober_24h', type: 'sobriety_milestone', title: '24 Hours', description: 'One day sober', icon: '\u{1F31F}', category: 'Sobriety Milestones', hint: 'Complete your first 24 hours sober' },
  { id: 'sober_7d', type: 'sobriety_milestone', title: '1 Week', description: 'Seven days sober', icon: '\u{2B50}', category: 'Sobriety Milestones', hint: 'Stay sober for 7 consecutive days' },
  { id: 'sober_30d', type: 'sobriety_milestone', title: '30 Days', description: 'One month sober', icon: '\u{1F3C5}', category: 'Sobriety Milestones', hint: 'Reach 30 days of sobriety' },
  { id: 'sober_90d', type: 'sobriety_milestone', title: '90 Days', description: 'Three months sober', icon: '\u{1F3C6}', category: 'Sobriety Milestones', hint: 'Reach 90 days of sobriety' },
  { id: 'sober_180d', type: 'sobriety_milestone', title: '6 Months', description: 'Half a year sober', icon: '\u{1F48E}', category: 'Sobriety Milestones', hint: 'Reach 180 days of sobriety' },
  { id: 'sober_365d', type: 'sobriety_milestone', title: '1 Year', description: 'One year sober!', icon: '\u{1F451}', category: 'Sobriety Milestones', hint: 'Reach 365 days of sobriety' },
  // Step Completion
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `step_${i + 1}`,
    type: 'step_completion' as AchievementType,
    title: `Step ${i + 1} Complete`,
    description: `Completed Step ${i + 1}`,
    icon: ['\u{0031}\u{FE0F}\u{20E3}', '\u{0032}\u{FE0F}\u{20E3}', '\u{0033}\u{FE0F}\u{20E3}', '\u{0034}\u{FE0F}\u{20E3}', '\u{0035}\u{FE0F}\u{20E3}', '\u{0036}\u{FE0F}\u{20E3}', '\u{0037}\u{FE0F}\u{20E3}', '\u{0038}\u{FE0F}\u{20E3}', '\u{0039}\u{FE0F}\u{20E3}', '\u{1F51F}', '\u{0031}\u{0031}\u{FE0F}\u{20E3}', '\u{0031}\u{0032}\u{FE0F}\u{20E3}'][i],
    category: 'Step Completion',
    hint: `Complete all modules in Step ${i + 1}`,
  })),
  // Course Completion
  { id: 'all_steps', type: 'course_completion', title: 'Program Graduate', description: 'Completed all 12 steps', icon: '\u{1F393}', category: 'Course Completion', hint: 'Complete all 12 steps' },
  // Streaks
  { id: 'streak_7d', type: 'streak', title: '7-Day Streak', description: 'Checked in 7 days in a row', icon: '\u{1F525}', category: 'Streaks', hint: 'Check in for 7 consecutive days' },
  { id: 'streak_30d', type: 'streak', title: '30-Day Streak', description: 'Checked in 30 days in a row', icon: '\u{1F4AA}', category: 'Streaks', hint: 'Check in for 30 consecutive days' },
  { id: 'streak_90d', type: 'streak', title: '90-Day Streak', description: 'Checked in 90 days in a row', icon: '\u{26A1}', category: 'Streaks', hint: 'Check in for 90 consecutive days' },
  // Community
  { id: 'first_post', type: 'community', title: 'First Post', description: 'Posted your first discussion', icon: '\u{1F4AC}', category: 'Community', hint: 'Create your first community thread' },
  { id: '10_replies', type: 'community', title: 'Helpful Member', description: 'Replied to 10 discussions', icon: '\u{1F91D}', category: 'Community', hint: 'Reply to 10 different discussions' },
];

const CATEGORIES = [
  'All',
  'Sobriety Milestones',
  'Step Completion',
  'Course Completion',
  'Streaks',
  'Community',
];

const RANK_CONFIG: Array<{
  rank: 'bronze' | 'silver' | 'gold' | 'platinum';
  label: string;
  minBadges: number;
  color: string;
  bgColor: string;
  icon: typeof Medal;
}> = [
  { rank: 'bronze', label: 'Bronze', minBadges: 0, color: 'text-orange-700', bgColor: 'bg-gradient-to-br from-orange-100 to-amber-200', icon: Medal },
  { rank: 'silver', label: 'Silver', minBadges: 5, color: 'text-stone-600', bgColor: 'bg-gradient-to-br from-stone-100 to-stone-300', icon: Medal },
  { rank: 'gold', label: 'Gold', minBadges: 15, color: 'text-yellow-700', bgColor: 'bg-gradient-to-br from-yellow-100 to-amber-300', icon: Crown },
  { rank: 'platinum', label: 'Platinum', minBadges: 25, color: 'text-purple-700', bgColor: 'bg-gradient-to-br from-violet-100 to-purple-300', icon: Sparkles },
];

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 bg-stone-100 rounded-xl" />
      <div className="h-10 bg-stone-100 rounded-lg" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-stone-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function Achievements() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [celebrationBadge, setCelebrationBadge] = useState<string | null>(null);

  // Fetch user achievements
  const { data: achievements, loading } = useCollection<Achievement>(
    'achievements',
    where('userId', '==', uid ?? ''),
    orderBy('earnedAt', 'desc')
  );

  // Fetch leaderboard (opt-in, anonymized)
  const { data: leaderboardData } = useCollection<{
    id: string;
    displayName: string;
    badgeCount: number;
    rank: string;
  }>(
    'leaderboard',
    orderBy('badgeCount', 'desc'),
    limit(20)
  );

  // Create earned set
  const earnedSet = useMemo(() => {
    const set = new Set<string>();
    achievements?.forEach((a) => {
      // Try to match by the badge id patterns
      set.add(a.id);
      set.add(a.title);
    });
    return set;
  }, [achievements]);

  // Earned count
  const earnedCount = achievements?.length ?? 0;

  // Current rank
  const currentRank = useMemo(() => {
    let rank = RANK_CONFIG[0];
    for (const r of RANK_CONFIG) {
      if (earnedCount >= r.minBadges) rank = r;
    }
    return rank;
  }, [earnedCount]);

  // Next rank
  const nextRank = useMemo(() => {
    const idx = RANK_CONFIG.findIndex((r) => r.rank === currentRank.rank);
    return idx < RANK_CONFIG.length - 1 ? RANK_CONFIG[idx + 1] : null;
  }, [currentRank]);

  // Filter badges by category
  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'All') return ALL_BADGES;
    return ALL_BADGES.filter((b) => b.category === selectedCategory);
  }, [selectedCategory]);

  // Check if a badge is earned
  const isBadgeEarned = (badge: BadgeDefinition): boolean => {
    return earnedSet.has(badge.id) || earnedSet.has(badge.title);
  };

  // Find earned achievement data for a badge
  const getEarnedData = (badge: BadgeDefinition): Achievement | undefined => {
    return achievements?.find((a) => a.id === badge.id || a.title === badge.title);
  };

  const handleShare = async (badge: BadgeDefinition) => {
    // This would post to Lane 3 social feed
    console.log('Share achievement to Lane 3:', badge.title);
    // Placeholder: in production, call setDocument on a posts collection
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <PageContainer title="Achievements" subtitle="Celebrate your milestones">
      {/* Celebration Animation Placeholder */}
      {celebrationBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setCelebrationBadge(null)}
        >
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-bounce max-w-xs mx-4">
            <div className="text-6xl mb-4">{celebrationBadge}</div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">Achievement Unlocked!</h3>
            <p className="text-sm text-stone-500">Tap anywhere to dismiss</p>
            {/* Confetti placeholder - in production, use react-confetti or canvas-confetti */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    backgroundColor: ['#f59e0b', '#10b981', '#6366f1', '#ef4444', '#ec4899'][i % 5],
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${0.5 + Math.random() * 1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rank Card */}
      <Card className={`${currentRank.bgColor} border-0`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/60 flex items-center justify-center">
              <currentRank.icon className={`h-8 w-8 ${currentRank.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">Current Rank</p>
              <h3 className={`text-2xl font-bold ${currentRank.color}`}>{currentRank.label}</h3>
              <p className="text-sm text-stone-600 mt-0.5">
                {earnedCount} badge{earnedCount !== 1 ? 's' : ''} earned
              </p>
            </div>
          </div>
          {nextRank && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-stone-500">Progress to {nextRank.label}</span>
                <span className="font-medium text-stone-700">
                  {earnedCount}/{nextRank.minBadges}
                </span>
              </div>
              <div className="h-2 bg-white/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (earnedCount / nextRank.minBadges) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rank Progression */}
      <div className="flex items-center justify-between px-2">
        {RANK_CONFIG.map((rank, idx) => {
          const isActive = currentRank.rank === rank.rank;
          const isEarned = earnedCount >= rank.minBadges;
          return (
            <div key={rank.rank} className="flex flex-col items-center">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-sm ${
                  isActive
                    ? `${rank.bgColor} shadow-md ring-2 ring-amber-400`
                    : isEarned
                      ? `${rank.bgColor}`
                      : 'bg-stone-100 text-stone-400'
                }`}
              >
                <rank.icon className={`h-5 w-5 ${isEarned ? rank.color : 'text-stone-400'}`} />
              </div>
              <p className={`text-[9px] mt-1 font-medium ${isActive ? rank.color : 'text-stone-400'}`}>
                {rank.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Category Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 pb-1">
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-700 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {filteredBadges.map((badge) => {
          const earned = isBadgeEarned(badge);
          const earnedData = getEarnedData(badge);

          return (
            <Card
              key={badge.id}
              className={`transition-all ${
                earned
                  ? 'border-amber-200 shadow-sm hover:shadow-md cursor-pointer'
                  : 'opacity-50 border-stone-100'
              }`}
              onClick={() => {
                if (earned) setCelebrationBadge(badge.icon);
              }}
            >
              <CardContent className="p-3 text-center">
                <div
                  className={`h-14 w-14 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    earned
                      ? 'bg-amber-50'
                      : 'bg-stone-50'
                  }`}
                >
                  {earned ? (
                    <span className="text-2xl">{badge.icon}</span>
                  ) : (
                    <Lock className="h-5 w-5 text-stone-300" />
                  )}
                </div>
                <p
                  className={`text-xs font-medium line-clamp-2 ${
                    earned ? 'text-stone-800' : 'text-stone-400'
                  }`}
                >
                  {badge.title}
                </p>
                {earned && earnedData ? (
                  <p className="text-[9px] text-stone-400 mt-0.5">
                    {formatDate(earnedData.earnedAt)}
                  </p>
                ) : (
                  <p className="text-[9px] text-stone-300 mt-0.5 line-clamp-1">
                    {badge.hint}
                  </p>
                )}
                {earned && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(badge);
                    }}
                    className="mt-1.5 inline-flex items-center gap-0.5 text-[9px] text-amber-600 hover:text-amber-800"
                  >
                    <Share2 className="h-2.5 w-2.5" /> Share
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="w-full flex items-center justify-between"
          >
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-600" /> Leaderboard
            </CardTitle>
            {showLeaderboard ? (
              <ChevronUp className="h-4 w-4 text-stone-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-stone-400" />
            )}
          </button>
        </CardHeader>
        {showLeaderboard && (
          <CardContent>
            <p className="text-xs text-stone-400 mb-3">
              Opt-in leaderboard showing anonymized usernames.
            </p>
            {leaderboardData && leaderboardData.length > 0 ? (
              <div className="space-y-2">
                {leaderboardData.map((entry, i) => {
                  const isCurrentUser = entry.id === uid;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        isCurrentUser ? 'bg-amber-50 border border-amber-200' : ''
                      }`}
                    >
                      <span
                        className={`text-sm font-bold w-6 text-center ${
                          i === 0
                            ? 'text-yellow-600'
                            : i === 1
                              ? 'text-stone-400'
                              : i === 2
                                ? 'text-orange-600'
                                : 'text-stone-500'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-700 truncate">
                          {isCurrentUser ? 'You' : entry.displayName}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Trophy className="h-3 w-3 text-amber-500" />
                        <span className="text-sm font-semibold text-stone-800">
                          {entry.badgeCount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <Users className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm text-stone-400">
                  Leaderboard data will appear as members earn badges.
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </PageContainer>
  );
}
