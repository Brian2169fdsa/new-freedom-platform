import { useState, useMemo, useCallback } from 'react';
import {
  PageContainer,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Button,
  Input,
  Badge,
  useCollection,
} from '@reprieve/shared';
import { useAuth } from '@reprieve/shared/hooks/useAuth';
import {
  Search,
  MapPin,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Briefcase,
  Filter,
  Heart,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Job {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly type: 'Full-Time' | 'Part-Time' | 'Temp';
  readonly category: JobCategory;
  readonly salaryMin: number;
  readonly salaryMax: number;
  readonly description: string;
  readonly requirements: readonly string[];
  readonly fairChance: boolean;
  readonly postedDate: string;
  readonly applicationUrl: string;
}

type JobCategory =
  | 'Warehouse'
  | 'Food Service'
  | 'Construction'
  | 'Retail'
  | 'Transportation'
  | 'Landscaping'
  | 'Other';

type JobType = 'Full-Time' | 'Part-Time' | 'Temp';

type ViewTab = 'all' | 'saved';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: readonly (JobCategory | 'All')[] = [
  'All',
  'Warehouse',
  'Food Service',
  'Construction',
  'Retail',
  'Transportation',
  'Landscaping',
  'Other',
] as const;

const JOB_TYPES: readonly JobType[] = ['Full-Time', 'Part-Time', 'Temp'] as const;

const TYPE_BADGE_STYLES: Record<JobType, string> = {
  'Full-Time': 'bg-blue-100 text-blue-800',
  'Part-Time': 'bg-amber-100 text-amber-800',
  Temp: 'bg-purple-100 text-purple-800',
};

// ---------------------------------------------------------------------------
// Data is fetched from Firestore via useCollection('jobs')
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function formatSalaryRange(min: number, max: number): string {
  return `$${min}/hr - $${max}/hr`;
}

function formatPostedDate(dateStr: string): string {
  const posted = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - posted.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Posted today';
  if (diffDays === 1) return 'Posted yesterday';
  if (diffDays < 7) return `Posted ${diffDays} days ago`;
  if (diffDays < 14) return 'Posted 1 week ago';
  return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
}

// ---------------------------------------------------------------------------
// Filter Bar Component
// ---------------------------------------------------------------------------

interface FilterBarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly selectedCategory: JobCategory | 'All';
  readonly onCategoryChange: (category: JobCategory | 'All') => void;
  readonly selectedType: JobType | 'All';
  readonly onTypeChange: (type: JobType | 'All') => void;
  readonly fairChanceOnly: boolean;
  readonly onFairChanceToggle: () => void;
}

function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  fairChanceOnly,
  onFairChanceToggle,
}: FilterBarProps) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-stone-50 border-amber-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search jobs by title, company, or keyword..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Toggle filters on mobile */}
          <button
            onClick={() => setFiltersExpanded((prev) => !prev)}
            className="flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors sm:hidden"
          >
            <Filter className="h-4 w-4" />
            {filtersExpanded ? 'Hide Filters' : 'Show Filters'}
            {filtersExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {/* Filter Controls */}
          <div className={`space-y-3 ${filtersExpanded ? 'block' : 'hidden'} sm:block`}>
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onCategoryChange(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      selectedCategory === cat
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter + Fair Chance Toggle */}
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                  Job Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => onTypeChange('All')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      selectedType === 'All'
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    All Types
                  </button>
                  {JOB_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => onTypeChange(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        selectedType === type
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={onFairChanceToggle}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  fairChanceOnly
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Fair Chance Only
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Job Card Component
// ---------------------------------------------------------------------------

interface JobCardProps {
  readonly job: Job;
  readonly isSaved: boolean;
  readonly isExpanded: boolean;
  readonly onToggleSave: (jobId: string) => void;
  readonly onToggleExpand: (jobId: string) => void;
}

function JobCard({ job, isSaved, isExpanded, onToggleSave, onToggleExpand }: JobCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-stone-800 text-base leading-tight">
                {job.title}
              </h3>
              <p className="text-sm text-stone-600 mt-0.5">{job.company}</p>
            </div>
            <button
              onClick={() => onToggleSave(job.id)}
              className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                isSaved
                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                  : 'text-stone-300 hover:text-amber-500 hover:bg-stone-50'
              }`}
              aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
            >
              {isSaved ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {formatSalaryRange(job.salaryMin, job.salaryMax)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatPostedDate(job.postedDate)}
            </span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE_STYLES[job.type]}`}
            >
              {job.type}
            </span>
            <Badge variant="secondary">{job.category}</Badge>
            {job.fairChance && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                <ShieldCheck className="h-3 w-3" />
                Fair Chance Employer
              </span>
            )}
          </div>

          {/* Description — 2 line clamp when collapsed */}
          <p
            className={`text-sm text-stone-600 leading-relaxed ${
              isExpanded ? '' : 'line-clamp-2'
            }`}
          >
            {job.description}
          </p>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div>
                <h4 className="text-sm font-medium text-stone-700 mb-2">Requirements</h4>
                <ul className="space-y-1.5">
                  {job.requirements.map((req) => (
                    <li
                      key={req}
                      className="flex items-start gap-2 text-sm text-stone-600"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleExpand(job.id)}
              className="flex-shrink-0"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Less Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  View Details
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => window.open(job.applicationUrl, '_blank', 'noopener,noreferrer')}
              className="flex-shrink-0"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Apply Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Empty State Component
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  readonly variant: 'no-results' | 'no-saved';
}

function EmptyState({ variant }: EmptyStateProps) {
  if (variant === 'no-saved') {
    return (
      <Card className="border-dashed border-stone-300">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center">
            <Bookmark className="h-7 w-7 text-amber-400" />
          </div>
          <h3 className="font-semibold text-stone-700 mb-1">No saved jobs yet</h3>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">
            Tap the bookmark icon on any job listing to save it here for easy access later.
            Building a list of opportunities is a great step forward.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-stone-300">
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center">
          <Search className="h-7 w-7 text-amber-400" />
        </div>
        <h3 className="font-semibold text-stone-700 mb-1">No jobs match your filters</h3>
        <p className="text-sm text-stone-500 max-w-sm mx-auto">
          Try adjusting your search or filters. New opportunities are added regularly.
          Every application is a step toward your fresh start.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// View Tabs Component
// ---------------------------------------------------------------------------

interface ViewTabsProps {
  readonly activeTab: ViewTab;
  readonly onTabChange: (tab: ViewTab) => void;
  readonly savedCount: number;
  readonly totalCount: number;
}

function ViewTabs({ activeTab, onTabChange, savedCount, totalCount }: ViewTabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-stone-100">
      <button
        onClick={() => onTabChange('all')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'all'
            ? 'bg-white text-stone-800 shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        <Briefcase className="h-4 w-4" />
        All Jobs
        <span className="text-xs text-stone-400">({totalCount})</span>
      </button>
      <button
        onClick={() => onTabChange('saved')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'saved'
            ? 'bg-white text-stone-800 shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        <Heart className="h-4 w-4" />
        Saved
        {savedCount > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-amber-100 text-amber-800 text-xs font-medium px-1.5">
            {savedCount}
          </span>
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function JobBoard() {
  // Auth
  useAuth();

  // Data from Firestore / demo store
  const { data: allJobs, loading } = useCollection<Job>('jobs');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | 'All'>('All');
  const [selectedType, setSelectedType] = useState<JobType | 'All'>('All');
  const [fairChanceOnly, setFairChanceOnly] = useState(false);

  // View state
  const [activeTab, setActiveTab] = useState<ViewTab>('all');
  const [savedJobIds, setSavedJobIds] = useState<ReadonlySet<string>>(new Set());
  const [expandedJobIds, setExpandedJobIds] = useState<ReadonlySet<string>>(new Set());

  // Handlers — all produce new state, never mutate
  const handleToggleSave = useCallback((jobId: string) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  }, []);

  const handleToggleExpand = useCallback((jobId: string) => {
    setExpandedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  }, []);

  const handleFairChanceToggle = useCallback(() => {
    setFairChanceOnly((prev) => !prev);
  }, []);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    const queryLower = searchQuery.toLowerCase().trim();

    return allJobs.filter((job) => {
      // Text search
      if (queryLower) {
        const searchable = `${job.title} ${job.company} ${job.description} ${job.category}`.toLowerCase();
        if (!searchable.includes(queryLower)) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'All' && job.category !== selectedCategory) {
        return false;
      }

      // Type filter
      if (selectedType !== 'All' && job.type !== selectedType) {
        return false;
      }

      // Fair chance filter
      if (fairChanceOnly && !job.fairChance) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedType, fairChanceOnly, allJobs]);

  // Jobs for current view
  const displayedJobs = useMemo(() => {
    if (activeTab === 'saved') {
      return filteredJobs.filter((job) => savedJobIds.has(job.id));
    }
    return filteredJobs;
  }, [activeTab, filteredJobs, savedJobIds]);

  const savedCount = allJobs.filter((job) => savedJobIds.has(job.id)).length;

  if (loading) {
    return (
      <PageContainer title="Job Board" subtitle="Fair-chance employment opportunities">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="space-y-3 animate-pulse">
                  <div className="h-5 w-48 bg-stone-200 rounded" />
                  <div className="h-4 w-32 bg-stone-100 rounded" />
                  <div className="h-4 w-full bg-stone-100 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Job Board" subtitle="Fair-chance employment opportunities">
      {/* Back link */}
      <Link
        to="/tools"
        className="inline-flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800 -mt-2 mb-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Tools
      </Link>

      {/* Encouraging banner */}
      <Card className="bg-gradient-to-r from-amber-600 to-amber-700 border-amber-700 text-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Your next chapter starts here</h3>
              <p className="text-amber-100 text-sm mt-0.5">
                Every listing below welcomes your application. Many employers on this board
                specifically partner with re-entry programs and value the dedication it takes
                to rebuild. You have what it takes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filters */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        fairChanceOnly={fairChanceOnly}
        onFairChanceToggle={handleFairChanceToggle}
      />

      {/* View Tabs */}
      <ViewTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        savedCount={savedCount}
        totalCount={filteredJobs.length}
      />

      {/* Results Count */}
      {displayedJobs.length > 0 && (
        <p className="text-sm text-stone-500">
          Showing {displayedJobs.length}{' '}
          {displayedJobs.length === 1 ? 'opportunity' : 'opportunities'}
          {activeTab === 'saved' ? ' you saved' : ''}
        </p>
      )}

      {/* Job Listings */}
      {displayedJobs.length > 0 ? (
        <div className="space-y-3">
          {displayedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={savedJobIds.has(job.id)}
              isExpanded={expandedJobIds.has(job.id)}
              onToggleSave={handleToggleSave}
              onToggleExpand={handleToggleExpand}
            />
          ))}
        </div>
      ) : (
        <EmptyState variant={activeTab === 'saved' ? 'no-saved' : 'no-results'} />
      )}
    </PageContainer>
  );
}
