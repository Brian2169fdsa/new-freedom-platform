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
  'Part-Time': 'bg-blue-100 text-blue-800',
  Temp: 'bg-purple-100 text-purple-800',
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_JOBS: readonly Job[] = [
  {
    id: 'job-001',
    title: 'Warehouse Associate',
    company: 'Desert Distribution Co.',
    location: 'Phoenix, AZ',
    type: 'Full-Time',
    category: 'Warehouse',
    salaryMin: 17,
    salaryMax: 21,
    description:
      'Join our growing warehouse team! We are looking for dependable individuals to help with receiving, sorting, and shipping products. No prior experience required — we provide full training and opportunities for advancement. We believe in second chances and value dedication.',
    requirements: [
      'Ability to lift up to 50 lbs',
      'Reliable transportation',
      'Willingness to work flexible shifts',
      'Basic math skills',
    ],
    fairChance: true,
    postedDate: '2026-02-18',
    applicationUrl: 'https://example.com/apply/warehouse-associate',
  },
  {
    id: 'job-002',
    title: 'Line Cook',
    company: 'Second Helpings Kitchen',
    location: 'Tempe, AZ',
    type: 'Full-Time',
    category: 'Food Service',
    salaryMin: 16,
    salaryMax: 19,
    description:
      'Fast-paced kitchen looking for a motivated line cook. We are a fair-chance employer that invests in our team. ServSafe training provided on the job. Great opportunity to build culinary skills and grow into a leadership role.',
    requirements: [
      'Ability to work in a fast-paced environment',
      'Willingness to learn food safety procedures',
      'Team player attitude',
      'Reliable and punctual',
    ],
    fairChance: true,
    postedDate: '2026-02-20',
    applicationUrl: 'https://example.com/apply/line-cook',
  },
  {
    id: 'job-003',
    title: 'Construction Laborer',
    company: 'Sunrise Builders LLC',
    location: 'Scottsdale, AZ',
    type: 'Full-Time',
    category: 'Construction',
    salaryMin: 18,
    salaryMax: 24,
    description:
      'We are hiring construction laborers for residential and commercial projects across the Valley. Great pay, steady hours, and room to grow into specialized trades. We partner with re-entry programs and welcome all applicants with a strong work ethic.',
    requirements: [
      'Physically able to perform manual labor in Arizona heat',
      'Basic tool knowledge (training provided)',
      'Reliable transportation to job sites',
      'OSHA 10 certification preferred but not required',
    ],
    fairChance: true,
    postedDate: '2026-02-15',
    applicationUrl: 'https://example.com/apply/construction-laborer',
  },
  {
    id: 'job-004',
    title: 'Retail Stocker — Night Shift',
    company: 'ValleyMart',
    location: 'Mesa, AZ',
    type: 'Part-Time',
    category: 'Retail',
    salaryMin: 15,
    salaryMax: 17,
    description:
      'Looking for night-shift stockers to unload trucks and organize merchandise. Quiet, independent work environment with consistent scheduling. Perfect for individuals who prefer an overnight schedule. We are proud to be a fair-chance employer.',
    requirements: [
      'Available 10 PM - 6 AM shifts',
      'Ability to stand for extended periods',
      'Attention to detail',
      'No retail experience necessary',
    ],
    fairChance: true,
    postedDate: '2026-02-19',
    applicationUrl: 'https://example.com/apply/retail-stocker',
  },
  {
    id: 'job-005',
    title: 'CDL Truck Driver',
    company: 'Cactus Freight Lines',
    location: 'Chandler, AZ',
    type: 'Full-Time',
    category: 'Transportation',
    salaryMin: 22,
    salaryMax: 28,
    description:
      'Regional CDL truck driver needed for Valley-area deliveries. Home every night. We offer CDL training sponsorship for candidates who are committed to a career in transportation. Fair-chance applications welcomed and encouraged.',
    requirements: [
      'Valid Arizona driver\'s license (CDL preferred, will train)',
      'Clean driving record (past 3 years)',
      'Ability to pass DOT physical',
      'Customer service skills for delivery interactions',
    ],
    fairChance: true,
    postedDate: '2026-02-17',
    applicationUrl: 'https://example.com/apply/cdl-driver',
  },
  {
    id: 'job-006',
    title: 'Landscape Crew Member',
    company: 'Desert Bloom Landscaping',
    location: 'Glendale, AZ',
    type: 'Full-Time',
    category: 'Landscaping',
    salaryMin: 16,
    salaryMax: 20,
    description:
      'Join our landscaping crew maintaining commercial and residential properties. Work outdoors, stay active, and learn valuable desert landscaping skills. Early morning starts, afternoons free. We hire based on attitude and work ethic, not background.',
    requirements: [
      'Physically fit and able to work outdoors in heat',
      'Reliable transportation',
      'Willingness to learn irrigation and plant care',
      'Team-oriented mindset',
    ],
    fairChance: true,
    postedDate: '2026-02-21',
    applicationUrl: 'https://example.com/apply/landscape-crew',
  },
  {
    id: 'job-007',
    title: 'Dishwasher / Kitchen Prep',
    company: 'Fresh Start Cafe',
    location: 'Phoenix, AZ',
    type: 'Part-Time',
    category: 'Food Service',
    salaryMin: 14,
    salaryMax: 16,
    description:
      'Our community-focused cafe is looking for someone to help in the kitchen with dishwashing and basic food prep. Flexible hours, free meals during shifts, and a supportive team. We are a social enterprise dedicated to providing employment to those rebuilding their lives.',
    requirements: [
      'Ability to work on your feet',
      'Positive attitude',
      'Willingness to follow kitchen safety rules',
      'No experience needed — we train',
    ],
    fairChance: true,
    postedDate: '2026-02-22',
    applicationUrl: 'https://example.com/apply/dishwasher-prep',
  },
  {
    id: 'job-008',
    title: 'Forklift Operator',
    company: 'Phoenix Logistics Hub',
    location: 'Phoenix, AZ',
    type: 'Full-Time',
    category: 'Warehouse',
    salaryMin: 19,
    salaryMax: 23,
    description:
      'Experienced or certified forklift operators needed for a busy distribution center. We offer competitive pay, overtime opportunities, and a pathway to shift lead positions. Forklift certification provided for the right candidate.',
    requirements: [
      'Forklift certification preferred (will certify)',
      'Ability to lift 40+ lbs regularly',
      'Warehouse experience a plus',
      'Strong safety awareness',
    ],
    fairChance: true,
    postedDate: '2026-02-16',
    applicationUrl: 'https://example.com/apply/forklift-operator',
  },
  {
    id: 'job-009',
    title: 'Temp — Event Setup Crew',
    company: 'Valley Events Staffing',
    location: 'Phoenix, AZ',
    type: 'Temp',
    category: 'Other',
    salaryMin: 15,
    salaryMax: 18,
    description:
      'Temporary positions available for setting up and tearing down events at venues across the Phoenix metro area. Flexible scheduling — pick the events that work for you. Great way to earn income while looking for permanent employment.',
    requirements: [
      'Physical ability to move tables, chairs, and equipment',
      'Reliable transportation to various venues',
      'Available on weekends',
      'Positive, can-do attitude',
    ],
    fairChance: true,
    postedDate: '2026-02-20',
    applicationUrl: 'https://example.com/apply/event-setup',
  },
  {
    id: 'job-010',
    title: 'Delivery Driver',
    company: 'QuickHaul Couriers',
    location: 'Tempe, AZ',
    type: 'Part-Time',
    category: 'Transportation',
    salaryMin: 16,
    salaryMax: 20,
    description:
      'Part-time delivery driver for local package and food deliveries. Use your own vehicle or we can provide one. Flexible hours that let you build a schedule around other commitments like classes, meetings, or appointments.',
    requirements: [
      'Valid Arizona driver\'s license',
      'Clean driving record',
      'Smartphone for navigation and delivery app',
      'Customer-friendly demeanor',
    ],
    fairChance: false,
    postedDate: '2026-02-14',
    applicationUrl: 'https://example.com/apply/delivery-driver',
  },
  {
    id: 'job-011',
    title: 'Janitorial / Maintenance Tech',
    company: 'CleanSlate Services',
    location: 'Mesa, AZ',
    type: 'Full-Time',
    category: 'Other',
    salaryMin: 16,
    salaryMax: 19,
    description:
      'We are hiring janitorial and light maintenance technicians for commercial buildings. Evening shifts with predictable hours. Our company was founded on the mission of creating job opportunities for individuals re-entering the workforce.',
    requirements: [
      'Ability to follow cleaning checklists',
      'Basic maintenance skills (changing light bulbs, minor repairs)',
      'Reliable and trustworthy',
      'Background check conducted — fair-chance policy applies',
    ],
    fairChance: true,
    postedDate: '2026-02-13',
    applicationUrl: 'https://example.com/apply/janitorial-tech',
  },
  {
    id: 'job-012',
    title: 'Concrete Finisher Helper',
    company: 'Ironwood Concrete',
    location: 'Gilbert, AZ',
    type: 'Temp',
    category: 'Construction',
    salaryMin: 17,
    salaryMax: 22,
    description:
      'Temp-to-hire opportunity learning concrete finishing for residential foundations and patios. Work alongside experienced crews who will teach you the trade. Strong performers get hired permanently with benefits. We actively recruit from re-entry programs.',
    requirements: [
      'Early morning availability (5 AM start)',
      'Physical endurance for demanding outdoor work',
      'Willingness to learn a skilled trade',
      'Dependable transportation',
    ],
    fairChance: true,
    postedDate: '2026-02-19',
    applicationUrl: 'https://example.com/apply/concrete-helper',
  },
];

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
    <Card className="bg-gradient-to-br from-blue-50 to-slate-50 border-blue-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
            className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors sm:hidden"
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
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onCategoryChange(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      selectedCategory === cat
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
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
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                  Job Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => onTypeChange('All')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      selectedType === 'All'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
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
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
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
                    : 'bg-white border-slate-200 text-slate-600 hover:border-green-300 hover:bg-green-50'
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
              <h3 className="font-semibold text-slate-800 text-base leading-tight">
                {job.title}
              </h3>
              <p className="text-sm text-slate-600 mt-0.5">{job.company}</p>
            </div>
            <button
              onClick={() => onToggleSave(job.id)}
              className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                isSaved
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  : 'text-slate-300 hover:text-blue-500 hover:bg-slate-50'
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
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
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
            className={`text-sm text-slate-600 leading-relaxed ${
              isExpanded ? '' : 'line-clamp-2'
            }`}
          >
            {job.description}
          </p>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Requirements</h4>
                <ul className="space-y-1.5">
                  {job.requirements.map((req) => (
                    <li
                      key={req}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
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
      <Card className="border-dashed border-slate-300">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center">
            <Bookmark className="h-7 w-7 text-blue-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No saved jobs yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Tap the bookmark icon on any job listing to save it here for easy access later.
            Building a list of opportunities is a great step forward.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-slate-300">
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center">
          <Search className="h-7 w-7 text-blue-400" />
        </div>
        <h3 className="font-semibold text-slate-700 mb-1">No jobs match your filters</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
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
    <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100">
      <button
        onClick={() => onTabChange('all')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'all'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Briefcase className="h-4 w-4" />
        All Jobs
        <span className="text-xs text-slate-400">({totalCount})</span>
      </button>
      <button
        onClick={() => onTabChange('saved')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'saved'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Heart className="h-4 w-4" />
        Saved
        {savedCount > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-blue-100 text-blue-800 text-xs font-medium px-1.5">
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

    return MOCK_JOBS.filter((job) => {
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
  }, [searchQuery, selectedCategory, selectedType, fairChanceOnly]);

  // Jobs for current view
  const displayedJobs = useMemo(() => {
    if (activeTab === 'saved') {
      return filteredJobs.filter((job) => savedJobIds.has(job.id));
    }
    return filteredJobs;
  }, [activeTab, filteredJobs, savedJobIds]);

  const savedCount = MOCK_JOBS.filter((job) => savedJobIds.has(job.id)).length;

  return (
    <PageContainer title="Job Board" subtitle="Fair-chance employment opportunities">
      {/* Back link */}
      <Link
        to="/tools"
        className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800 -mt-2 mb-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Tools
      </Link>

      {/* Encouraging banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-blue-700 text-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Your next chapter starts here</h3>
              <p className="text-blue-100 text-sm mt-0.5">
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
        <p className="text-sm text-slate-500">
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
