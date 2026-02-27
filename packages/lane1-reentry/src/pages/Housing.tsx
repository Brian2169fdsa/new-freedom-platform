import { useState, useMemo, useCallback } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  useCollection,
} from '@reprieve/shared';
import { useAuth } from '@reprieve/shared/hooks/useAuth';
import {
  Search,
  MapPin,
  DollarSign,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkCheck,
  Home,
  Heart,
  Sparkles,
  Filter,
  Users,
  Phone,
  ExternalLink,
  Wifi,
  Car,
  UtensilsCrossed,
  ShieldCheck,
  Dog,
  Accessibility,
  Baby,
  X,
  ImageOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HousingType = 'sober_living' | 'transitional' | 'affordable' | 'shelter' | 'section_8';

type AvailabilityStatus = 'available' | 'waitlist' | 'full';

type Amenity =
  | 'wifi'
  | 'parking'
  | 'meals'
  | 'security'
  | 'pet_friendly'
  | 'accessible'
  | 'family_friendly'
  | 'case_management'
  | 'job_training'
  | 'drug_testing';

type DistanceRadius = 5 | 10 | 25 | 50;

type ViewTab = 'search' | 'saved';

interface HousingListing {
  readonly id: string;
  readonly name: string;
  readonly type: HousingType;
  readonly address: string;
  readonly city: string;
  readonly priceMin: number;
  readonly priceMax: number;
  readonly pricePeriod: 'month' | 'week' | 'night';
  readonly availability: AvailabilityStatus;
  readonly distance: number;
  readonly amenities: readonly Amenity[];
  readonly description: string;
  readonly rules: readonly string[];
  readonly requirements: readonly string[];
  readonly contactPhone: string;
  readonly contactEmail: string;
  readonly applicationUrl: string;
  readonly acceptsVouchers: boolean;
  readonly capacity: number;
  readonly currentOccupancy: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOUSING_TYPE_LABELS: Record<HousingType, string> = {
  sober_living: 'Sober Living',
  transitional: 'Transitional',
  affordable: 'Affordable Housing',
  shelter: 'Shelter',
  section_8: 'Section 8',
};

const HOUSING_TYPE_FILTERS: readonly { readonly value: HousingType; readonly label: string }[] = [
  { value: 'sober_living', label: 'Sober Living' },
  { value: 'transitional', label: 'Transitional' },
  { value: 'affordable', label: 'Affordable Housing' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'section_8', label: 'Section 8' },
] as const;

const DISTANCE_OPTIONS: readonly DistanceRadius[] = [5, 10, 25, 50] as const;

const TYPE_BADGE_STYLES: Record<HousingType, string> = {
  sober_living: 'bg-green-100 text-green-800',
  transitional: 'bg-blue-100 text-blue-800',
  affordable: 'bg-purple-100 text-purple-800',
  shelter: 'bg-amber-100 text-amber-800',
  section_8: 'bg-teal-100 text-teal-800',
};

const AVAILABILITY_CONFIG: Record<AvailabilityStatus, { label: string; style: string; icon: typeof CheckCircle2 }> = {
  available: { label: 'Available', style: 'text-green-700 bg-green-50', icon: CheckCircle2 },
  waitlist: { label: 'Waitlist', style: 'text-amber-700 bg-amber-50', icon: AlertCircle },
  full: { label: 'Full', style: 'text-red-700 bg-red-50', icon: XCircle },
};

const AMENITY_CONFIG: Record<Amenity, { label: string; icon: typeof Wifi }> = {
  wifi: { label: 'Wi-Fi', icon: Wifi },
  parking: { label: 'Parking', icon: Car },
  meals: { label: 'Meals', icon: UtensilsCrossed },
  security: { label: '24/7 Security', icon: ShieldCheck },
  pet_friendly: { label: 'Pet Friendly', icon: Dog },
  accessible: { label: 'Accessible', icon: Accessibility },
  family_friendly: { label: 'Family Friendly', icon: Baby },
  case_management: { label: 'Case Mgmt', icon: Users },
  job_training: { label: 'Job Training', icon: ShieldCheck },
  drug_testing: { label: 'Drug Testing', icon: ShieldCheck },
};

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function formatPrice(listing: HousingListing): string {
  if (listing.priceMin === 0 && listing.priceMax === 0) {
    return 'Free';
  }
  const period = listing.pricePeriod === 'month' ? '/mo' : listing.pricePeriod === 'week' ? '/wk' : '/night';
  if (listing.priceMin === listing.priceMax) {
    return `$${listing.priceMin}${period}`;
  }
  if (listing.priceMin === 0) {
    return `Up to $${listing.priceMax}${period}`;
  }
  return `$${listing.priceMin} - $${listing.priceMax}${period}`;
}

function formatDistance(miles: number): string {
  return `${miles.toFixed(1)} mi`;
}

function getOccupancyPercentage(listing: HousingListing): number {
  if (listing.capacity === 0) return 0;
  return Math.round((listing.currentOccupancy / listing.capacity) * 100);
}

// ---------------------------------------------------------------------------
// Filter Bar Component
// ---------------------------------------------------------------------------

interface FilterBarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly selectedTypes: ReadonlySet<HousingType>;
  readonly onTypeToggle: (type: HousingType) => void;
  readonly priceMin: string;
  readonly priceMax: string;
  readonly onPriceMinChange: (value: string) => void;
  readonly onPriceMaxChange: (value: string) => void;
  readonly distanceRadius: DistanceRadius;
  readonly onDistanceChange: (radius: DistanceRadius) => void;
}

function FilterBar({
  searchQuery,
  onSearchChange,
  selectedTypes,
  onTypeToggle,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  distanceRadius,
  onDistanceChange,
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
              placeholder="Search by name, address, or keyword..."
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
            {/* Housing Type Filter Pills */}
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                Housing Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {HOUSING_TYPE_FILTERS.map((typeFilter) => (
                  <button
                    key={typeFilter.value}
                    onClick={() => onTypeToggle(typeFilter.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      selectedTypes.has(typeFilter.value)
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    {typeFilter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range + Distance */}
            <div className="flex flex-wrap items-end gap-4">
              {/* Price Range */}
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                  Price Range ($/month)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => onPriceMinChange(e.target.value)}
                    className="w-24 h-8 text-xs"
                    min={0}
                  />
                  <span className="text-stone-400 text-xs">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => onPriceMaxChange(e.target.value)}
                    className="w-24 h-8 text-xs"
                    min={0}
                  />
                </div>
              </div>

              {/* Distance Radius */}
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                  Distance
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DISTANCE_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => onDistanceChange(d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        distanceRadius === d
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      {d} mi
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Amenity Icon Component
// ---------------------------------------------------------------------------

interface AmenityIconProps {
  readonly amenity: Amenity;
  readonly size?: 'sm' | 'md';
}

function AmenityIcon({ amenity, size = 'sm' }: AmenityIconProps) {
  const config = AMENITY_CONFIG[amenity];
  const IconComponent = config.icon;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <span
      className="inline-flex items-center gap-1 text-stone-500"
      title={config.label}
    >
      <IconComponent className={iconSize} />
      {size === 'md' && <span className="text-xs">{config.label}</span>}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Housing Card Component
// ---------------------------------------------------------------------------

interface HousingCardProps {
  readonly listing: HousingListing;
  readonly isSaved: boolean;
  readonly onToggleSave: (listingId: string) => void;
  readonly onOpenDetail: (listingId: string) => void;
}

function HousingCard({ listing, isSaved, onToggleSave, onOpenDetail }: HousingCardProps) {
  const availConfig = AVAILABILITY_CONFIG[listing.availability];
  const AvailIcon = availConfig.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-stone-800 text-base leading-tight">
                {listing.name}
              </h3>
              <p className="text-sm text-stone-600 mt-0.5">
                {listing.address}, {listing.city}
              </p>
            </div>
            <button
              onClick={() => onToggleSave(listing.id)}
              className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                isSaved
                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                  : 'text-stone-300 hover:text-amber-500 hover:bg-stone-50'
              }`}
              aria-label={isSaved ? 'Remove from saved listings' : 'Save listing'}
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
              <DollarSign className="h-3.5 w-3.5" />
              {formatPrice(listing)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {formatDistance(listing.distance)}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${availConfig.style}`}>
              <AvailIcon className="h-3 w-3" />
              {availConfig.label}
            </span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE_STYLES[listing.type]}`}
            >
              {HOUSING_TYPE_LABELS[listing.type]}
            </span>
            {listing.acceptsVouchers && (
              <Badge variant="success">Accepts Vouchers</Badge>
            )}
          </div>

          {/* Amenity Icons */}
          {listing.amenities.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {listing.amenities.map((amenity) => (
                <AmenityIcon key={amenity} amenity={amenity} />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDetail(listing.id)}
              className="flex-shrink-0"
            >
              View Details
            </Button>
            {listing.availability !== 'full' && (
              <Button
                size="sm"
                onClick={() => window.open(listing.applicationUrl, '_blank', 'noopener,noreferrer')}
                className="flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Apply
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Housing Detail Modal Component
// ---------------------------------------------------------------------------

interface HousingDetailModalProps {
  readonly listing: HousingListing | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly isSaved: boolean;
  readonly onToggleSave: (listingId: string) => void;
}

function HousingDetailModal({ listing, open, onOpenChange, isSaved, onToggleSave }: HousingDetailModalProps) {
  if (!listing) return null;

  const availConfig = AVAILABILITY_CONFIG[listing.availability];
  const AvailIcon = availConfig.icon;
  const occupancyPercent = getOccupancyPercentage(listing);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{listing.name}</DialogTitle>
        <p className="text-sm text-stone-500 mt-1">
          {listing.address}, {listing.city}
        </p>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-5">
          {/* Photo placeholder */}
          <div className="bg-stone-100 rounded-lg h-40 flex items-center justify-center">
            <div className="text-center text-stone-400">
              <ImageOff className="h-8 w-8 mx-auto mb-2" />
              <p className="text-xs">Photos coming soon</p>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-50 rounded-lg p-3 text-center">
              <DollarSign className="h-4 w-4 mx-auto text-stone-400 mb-1" />
              <p className="text-sm font-semibold text-stone-800">{formatPrice(listing)}</p>
              <p className="text-[11px] text-stone-500">Price</p>
            </div>
            <div className="bg-stone-50 rounded-lg p-3 text-center">
              <MapPin className="h-4 w-4 mx-auto text-stone-400 mb-1" />
              <p className="text-sm font-semibold text-stone-800">{formatDistance(listing.distance)}</p>
              <p className="text-[11px] text-stone-500">Distance</p>
            </div>
          </div>

          {/* Availability & Occupancy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${availConfig.style}`}>
                <AvailIcon className="h-3 w-3" />
                {availConfig.label}
              </span>
              <span className="text-xs text-stone-500">
                {listing.currentOccupancy}/{listing.capacity} occupied ({occupancyPercent}%)
              </span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  occupancyPercent >= 90 ? 'bg-red-500' : occupancyPercent >= 70 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>

          {/* Type & Vouchers */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE_STYLES[listing.type]}`}>
              {HOUSING_TYPE_LABELS[listing.type]}
            </span>
            {listing.acceptsVouchers && (
              <Badge variant="success">Accepts Vouchers</Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-stone-700 mb-1.5">About</h4>
            <p className="text-sm text-stone-600 leading-relaxed">{listing.description}</p>
          </div>

          {/* Amenities */}
          {listing.amenities.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-stone-700 mb-1.5">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-600"
                  >
                    <AmenityIcon amenity={amenity} />
                    {AMENITY_CONFIG[amenity].label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {listing.rules.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-stone-700 mb-1.5">House Rules</h4>
              <ul className="space-y-1.5">
                {listing.rules.map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-sm text-stone-600">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {listing.requirements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-stone-700 mb-1.5">Requirements</h4>
              <ul className="space-y-1.5">
                {listing.requirements.map((req) => (
                  <li key={req} className="flex items-start gap-2 text-sm text-stone-600">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-stone-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-stone-700 mb-2">Contact Information</h4>
            <div className="space-y-1.5 text-sm text-stone-600">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-stone-400" />
                {listing.contactPhone}
              </p>
              <p className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                {listing.contactEmail}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleSave(listing.id)}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="h-4 w-4 mr-1" />
              Saved
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4 mr-1" />
              Save
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`tel:${listing.contactPhone.replace(/[^0-9+]/g, '')}`, '_self')}
        >
          <Phone className="h-4 w-4 mr-1" />
          Call
        </Button>
        {listing.availability !== 'full' && (
          <Button
            size="sm"
            onClick={() => window.open(listing.applicationUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Apply Now
          </Button>
        )}
      </DialogFooter>
    </Dialog>
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
        onClick={() => onTabChange('search')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'search'
            ? 'bg-white text-stone-800 shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        <Search className="h-4 w-4" />
        Search
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
          <h3 className="font-semibold text-stone-700 mb-1">No saved listings yet</h3>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">
            Tap the bookmark icon on any housing listing to save it here for easy access later.
            Having options is the first step toward finding your next home.
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
        <h3 className="font-semibold text-stone-700 mb-1">No listings match your filters</h3>
        <p className="text-sm text-stone-500 max-w-sm mx-auto">
          Try adjusting your search, filters, or distance radius.
          New housing options are added regularly. Keep looking — your next home is out there.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function Housing() {
  // Auth
  useAuth();

  // Data from Firestore / demo store
  const { data: allListings, loading } = useCollection<HousingListing>('housing_listings');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ReadonlySet<HousingType>>(new Set());
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [distanceRadius, setDistanceRadius] = useState<DistanceRadius>(25);

  // View state
  const [activeTab, setActiveTab] = useState<ViewTab>('search');
  const [savedListingIds, setSavedListingIds] = useState<ReadonlySet<string>>(new Set());
  const [detailListingId, setDetailListingId] = useState<string | null>(null);

  // Handlers — all produce new state, never mutate
  const handleTypeToggle = useCallback((type: HousingType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleToggleSave = useCallback((listingId: string) => {
    setSavedListingIds((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      return next;
    });
  }, []);

  const handleOpenDetail = useCallback((listingId: string) => {
    setDetailListingId(listingId);
  }, []);

  const handleCloseDetail = useCallback((open: boolean) => {
    if (!open) {
      setDetailListingId(null);
    }
  }, []);

  // Filtered listings
  const filteredListings = useMemo(() => {
    const queryLower = searchQuery.toLowerCase().trim();
    const parsedMin = priceMin ? Number(priceMin) : null;
    const parsedMax = priceMax ? Number(priceMax) : null;

    return allListings.filter((listing) => {
      // Text search
      if (queryLower) {
        const searchable = `${listing.name} ${listing.address} ${listing.city} ${listing.description} ${HOUSING_TYPE_LABELS[listing.type]}`.toLowerCase();
        if (!searchable.includes(queryLower)) {
          return false;
        }
      }

      // Type filter — if any types selected, listing must match one
      if (selectedTypes.size > 0 && !selectedTypes.has(listing.type)) {
        return false;
      }

      // Price filter
      if (parsedMin !== null && !isNaN(parsedMin) && listing.priceMax < parsedMin) {
        return false;
      }
      if (parsedMax !== null && !isNaN(parsedMax) && listing.priceMin > parsedMax) {
        return false;
      }

      // Distance filter
      if (listing.distance > distanceRadius) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedTypes, priceMin, priceMax, distanceRadius, allListings]);

  // Listings for current view
  const displayedListings = useMemo(() => {
    if (activeTab === 'saved') {
      return filteredListings.filter((listing) => savedListingIds.has(listing.id));
    }
    return filteredListings;
  }, [activeTab, filteredListings, savedListingIds]);

  const savedCount = allListings.filter((listing) => savedListingIds.has(listing.id)).length;

  // Detail modal listing
  const detailListing = useMemo(() => {
    if (!detailListingId) return null;
    return allListings.find((l) => l.id === detailListingId) ?? null;
  }, [detailListingId, allListings]);

  if (loading) {
    return (
      <PageContainer title="Housing Search" subtitle="Find safe, affordable housing in the Phoenix area">
        <div className="grid gap-3 sm:grid-cols-2">
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
    <PageContainer title="Housing Search" subtitle="Find safe, affordable housing in the Phoenix area">
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
              <h3 className="font-semibold text-white text-sm">A safe place to call home</h3>
              <p className="text-amber-100 text-sm mt-0.5">
                Stable housing is the foundation for everything else. Browse sober living homes,
                shelters, transitional programs, and affordable apartments across the Phoenix metro area.
                Many of these organizations specifically serve people rebuilding their lives.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filters */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTypes={selectedTypes}
        onTypeToggle={handleTypeToggle}
        priceMin={priceMin}
        priceMax={priceMax}
        onPriceMinChange={setPriceMin}
        onPriceMaxChange={setPriceMax}
        distanceRadius={distanceRadius}
        onDistanceChange={setDistanceRadius}
      />

      {/* View Tabs */}
      <ViewTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        savedCount={savedCount}
        totalCount={filteredListings.length}
      />

      {/* Results Count */}
      {displayedListings.length > 0 && (
        <p className="text-sm text-stone-500">
          Showing {displayedListings.length}{' '}
          {displayedListings.length === 1 ? 'listing' : 'listings'}
          {activeTab === 'saved' ? ' you saved' : ''}
        </p>
      )}

      {/* Listing Grid */}
      {displayedListings.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {displayedListings.map((listing) => (
            <HousingCard
              key={listing.id}
              listing={listing}
              isSaved={savedListingIds.has(listing.id)}
              onToggleSave={handleToggleSave}
              onOpenDetail={handleOpenDetail}
            />
          ))}
        </div>
      ) : (
        <EmptyState variant={activeTab === 'saved' ? 'no-saved' : 'no-results'} />
      )}

      {/* Detail Modal */}
      <HousingDetailModal
        listing={detailListing}
        open={detailListingId !== null}
        onOpenChange={handleCloseDetail}
        isSaved={detailListingId !== null && savedListingIds.has(detailListingId)}
        onToggleSave={handleToggleSave}
      />
    </PageContainer>
  );
}
