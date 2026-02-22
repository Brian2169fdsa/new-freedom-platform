import React, { useState, useMemo } from 'react';
import {
  useCollection,
  useGeolocation,
  haversineDistance,
  formatDistance,
  type Resource,
  type ResourceType,
} from '@reprieve/shared';
import { where, orderBy } from 'firebase/firestore';
import {
  MapPin, Phone, Clock, ExternalLink, Navigation, Search, AlertTriangle, Bed,
  Utensils, Stethoscope, Brain, Scale, Briefcase, Bus, Droplets, Wifi, HelpCircle,
  List, Map as MapIcon, Locate,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type ViewMode = 'list' | 'map';

const RESOURCE_CATEGORIES: { type: ResourceType; label: string; icon: React.ReactNode; color: string; markerColor: string }[] = [
  { type: 'shelter', label: 'Shelters', icon: <Bed className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600', markerColor: '#3b82f6' },
  { type: 'food', label: 'Food', icon: <Utensils className="h-5 w-5" />, color: 'bg-green-50 text-green-600', markerColor: '#22c55e' },
  { type: 'medical', label: 'Medical', icon: <Stethoscope className="h-5 w-5" />, color: 'bg-red-50 text-red-600', markerColor: '#ef4444' },
  { type: 'mental_health', label: 'Mental Health', icon: <Brain className="h-5 w-5" />, color: 'bg-purple-50 text-purple-600', markerColor: '#a855f7' },
  { type: 'legal', label: 'Legal Aid', icon: <Scale className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600', markerColor: '#f59e0b' },
  { type: 'employment', label: 'Jobs', icon: <Briefcase className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600', markerColor: '#10b981' },
  { type: 'transportation', label: 'Transport', icon: <Bus className="h-5 w-5" />, color: 'bg-sky-50 text-sky-600', markerColor: '#0ea5e9' },
  { type: 'showers', label: 'Showers', icon: <Droplets className="h-5 w-5" />, color: 'bg-cyan-50 text-cyan-600', markerColor: '#06b6d4' },
  { type: 'phone_internet', label: 'Phone/WiFi', icon: <Wifi className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-600', markerColor: '#6366f1' },
  { type: 'other', label: 'Other', icon: <HelpCircle className="h-5 w-5" />, color: 'bg-stone-50 text-stone-600', markerColor: '#78716c' },
];

function getCategoryInfo(type: ResourceType) {
  return RESOURCE_CATEGORIES.find((c) => c.type === type) ?? RESOURCE_CATEGORIES[RESOURCE_CATEGORIES.length - 1];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

function getSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EmergencyBanner() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-800 text-sm">Emergency Resources</h3>
          <div className="mt-2 space-y-1.5">
            <a href="tel:911" className="flex items-center gap-2 text-sm text-red-700 font-medium">
              <Phone className="h-3.5 w-3.5" /> 911 — Emergency
            </a>
            <a href="tel:988" className="flex items-center gap-2 text-sm text-red-700 font-medium">
              <Phone className="h-3.5 w-3.5" /> 988 — Suicide & Crisis Lifeline
            </a>
            <a href="tel:18446534673" className="flex items-center gap-2 text-sm text-red-700 font-medium">
              <Phone className="h-3.5 w-3.5" /> 1-844-534-4673 — AZ Crisis Line
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function DistanceBadge({ miles }: { miles: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
      <Locate className="h-3 w-3" />
      {formatDistance(miles)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Resource Card (used in list view)
// ---------------------------------------------------------------------------

function ResourceCard({ resource, distance }: { resource: Resource; distance: number | null }) {
  const category = getCategoryInfo(resource.type);
  const mapsUrl = getSearchUrl(resource.address);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${category.color}`}>
          {category.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-stone-800 text-sm">{resource.name}</h3>
            {distance !== null && <DistanceBadge miles={distance} />}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">{resource.description}</p>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <MapPin className="h-3.5 w-3.5 text-stone-400 flex-shrink-0" />
              <span className="truncate">{resource.address}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <Clock className="h-3.5 w-3.5 text-stone-400 flex-shrink-0" />
              <span>{resource.hours}</span>
            </div>
            {resource.phone && (
              <a href={`tel:${resource.phone}`} className="flex items-center gap-2 text-xs text-amber-700 font-medium">
                <Phone className="h-3.5 w-3.5" />
                {resource.phone}
              </a>
            )}
          </div>

          {/* Availability */}
          {resource.availability && (
            <div className="mt-2 flex items-center gap-2">
              {resource.availability.beds && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  resource.availability.beds.available > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {resource.availability.beds.available > 0
                    ? `${resource.availability.beds.available} beds available`
                    : 'No beds available'}
                </span>
              )}
              {resource.availability.walkIn && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Walk-in OK
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600"
            >
              <Navigation className="h-3.5 w-3.5" />
              Directions
            </a>
            {resource.website && (
              <a
                href={resource.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-200"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Website
              </a>
            )}
          </div>

          {/* Services */}
          {resource.services.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resource.services.slice(0, 4).map((service) => (
                <span key={service} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-xs">
                  {service}
                </span>
              ))}
              {resource.services.length > 4 && (
                <span className="text-xs text-stone-400">+{resource.services.length - 4} more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Map View
// ---------------------------------------------------------------------------

function MapPlaceholderSvg() {
  return (
    <svg
      viewBox="0 0 400 300"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Map placeholder"
    >
      {/* Background */}
      <rect width="400" height="300" fill="#e8e4de" />

      {/* Grid lines representing streets */}
      <g stroke="#d6d3cd" strokeWidth="1.5">
        {/* Horizontal streets */}
        <line x1="0" y1="50" x2="400" y2="50" />
        <line x1="0" y1="100" x2="400" y2="100" />
        <line x1="0" y1="150" x2="400" y2="150" />
        <line x1="0" y1="200" x2="400" y2="200" />
        <line x1="0" y1="250" x2="400" y2="250" />

        {/* Vertical streets */}
        <line x1="60" y1="0" x2="60" y2="300" />
        <line x1="130" y1="0" x2="130" y2="300" />
        <line x1="200" y1="0" x2="200" y2="300" />
        <line x1="270" y1="0" x2="270" y2="300" />
        <line x1="340" y1="0" x2="340" y2="300" />
      </g>

      {/* Main roads (wider) */}
      <g stroke="#cbc7c0" strokeWidth="3">
        <line x1="0" y1="150" x2="400" y2="150" />
        <line x1="200" y1="0" x2="200" y2="300" />
      </g>

      {/* Green areas */}
      <rect x="65" y="55" width="60" height="40" rx="4" fill="#c8dfc0" opacity="0.6" />
      <rect x="275" y="205" width="60" height="40" rx="4" fill="#c8dfc0" opacity="0.6" />

      {/* Center label */}
      <text x="200" y="155" textAnchor="middle" fill="#9ca3af" fontSize="12" fontFamily="system-ui">
        Phoenix, AZ
      </text>

      {/* Map pin icon in center */}
      <g transform="translate(192, 115)">
        <path
          d="M8 0C3.6 0 0 3.6 0 8c0 5.4 8 14 8 14s8-8.6 8-14c0-4.4-3.6-8-8-8zm0 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"
          fill="#f59e0b"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}

function MapSidebarItem({
  resource,
  distance,
}: {
  resource: Resource;
  distance: number | null;
}) {
  const category = getCategoryInfo(resource.type);
  const directionsUrl = getDirectionsUrl(resource.address);

  return (
    <div className="border-b border-stone-100 last:border-b-0 p-3">
      <div className="flex items-start gap-2.5">
        {/* Category color dot */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: category.markerColor }}
          title={category.label}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-stone-800 text-xs leading-tight">
              {resource.name}
            </h4>
            {distance !== null && <DistanceBadge miles={distance} />}
          </div>

          <p className="text-xs text-stone-500 mt-0.5 truncate">{resource.address}</p>

          <div className="flex items-center gap-1.5 mt-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white rounded-md text-xs font-medium hover:bg-amber-600 transition-colors"
            >
              <Navigation className="h-3 w-3" />
              Get Directions
            </a>
            {resource.phone && (
              <a
                href={`tel:${resource.phone}`}
                className="flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white rounded-md text-xs font-medium hover:bg-green-600 transition-colors"
              >
                <Phone className="h-3 w-3" />
                Call
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MapView({
  resources,
  distances,
}: {
  resources: Resource[];
  distances: Map<string, number>;
}) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      {/* Legend */}
      <div className="border-b border-stone-200 px-4 py-2.5 bg-stone-50">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {RESOURCE_CATEGORIES.slice(0, -1).map((cat) => (
            <div key={cat.type} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cat.markerColor }}
              />
              <span className="text-xs text-stone-600">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Map placeholder area */}
        <div className="md:w-1/2 relative bg-stone-100">
          <div className="aspect-[4/3] md:aspect-auto md:h-full min-h-[240px] flex items-center justify-center relative overflow-hidden">
            <MapPlaceholderSvg />

            {/* Overlay with resource count markers */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-4 shadow-lg text-center">
                <MapIcon className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-stone-800">
                  {resources.length} Resources in Phoenix
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Use "Get Directions" to navigate
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  Full map requires Google Maps API key
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar with resource list */}
        <div className="md:w-1/2 max-h-[500px] overflow-y-auto divide-y divide-stone-100">
          {resources.length === 0 ? (
            <div className="p-6 text-center">
              <MapPin className="h-6 w-6 text-stone-300 mx-auto" />
              <p className="text-sm text-stone-500 mt-2">No resources match your filters</p>
            </div>
          ) : (
            resources.map((resource) => (
              <MapSidebarItem
                key={resource.id}
                resource={resource}
                distance={distances.get(resource.id) ?? null}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View Toggle
// ---------------------------------------------------------------------------

function ViewToggle({
  view,
  onViewChange,
}: {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
}) {
  return (
    <div className="inline-flex bg-stone-100 rounded-lg p-0.5">
      <button
        onClick={() => onViewChange('list')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          view === 'list'
            ? 'bg-white text-stone-800 shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
        }`}
        aria-pressed={view === 'list'}
      >
        <List className="h-3.5 w-3.5" />
        List View
      </button>
      <button
        onClick={() => onViewChange('map')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          view === 'map'
            ? 'bg-white text-stone-800 shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
        }`}
        aria-pressed={view === 'map'}
      >
        <MapIcon className="h-3.5 w-3.5" />
        Map View
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-stone-200 p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-stone-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-stone-200 rounded" />
              <div className="h-3 w-full bg-stone-100 rounded" />
              <div className="h-3 w-2/3 bg-stone-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Resources() {
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('list');

  const geo = useGeolocation();

  const constraints = selectedType === 'all'
    ? [orderBy('name')]
    : [where('type', '==', selectedType), orderBy('name')];

  const { data: resources, loading } = useCollection<Resource>('resources', ...constraints);

  // Calculate distances for all resources that have coordinates
  const distances = useMemo<Map<string, number>>(() => {
    const map = new Map<string, number>();
    if (geo.latitude === null || geo.longitude === null) {
      return map;
    }
    for (const r of resources) {
      if (r.location?.latitude != null && r.location?.longitude != null) {
        const d = haversineDistance(
          geo.latitude,
          geo.longitude,
          r.location.latitude,
          r.location.longitude,
        );
        map.set(r.id, d);
      }
    }
    return map;
  }, [resources, geo.latitude, geo.longitude]);

  // Filter by search text
  const searched = useMemo(() => {
    if (!search) return resources;
    const term = search.toLowerCase();
    return resources.filter((r) =>
      r.name.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term),
    );
  }, [resources, search]);

  // Sort by distance when location is available, otherwise keep original order
  const sorted = useMemo(() => {
    if (distances.size === 0) return searched;
    return [...searched].sort((a, b) => {
      const da = distances.get(a.id) ?? Infinity;
      const db = distances.get(b.id) ?? Infinity;
      return da - db;
    });
  }, [searched, distances]);

  return (
    <div className="space-y-4">
      {/* Header with view toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-800">Resources</h1>
          <p className="text-sm text-stone-500 mt-0.5">Find help near you in Phoenix</p>
        </div>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      <EmergencyBanner />

      {/* Location status */}
      {!geo.loading && geo.latitude !== null && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <Locate className="h-3.5 w-3.5" />
          <span>Location enabled — resources sorted by distance</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        <button
          onClick={() => setSelectedType('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedType === 'all'
              ? 'bg-amber-500 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          All
        </button>
        {RESOURCE_CATEGORIES.slice(0, -1).map((cat) => (
          <button
            key={cat.type}
            onClick={() => setSelectedType(cat.type)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedType === cat.type
                ? 'bg-amber-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSkeleton />
      ) : view === 'map' ? (
        <MapView resources={sorted} distances={distances} />
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <MapPin className="h-8 w-8 text-stone-300 mx-auto" />
          <h3 className="font-medium text-stone-800 mt-3">No resources found</h3>
          <p className="text-sm text-stone-500 mt-1">
            {search ? 'Try a different search term' : 'Resources will appear here as they are verified'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-stone-400">{sorted.length} resources found</p>
          {sorted.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              distance={distances.get(resource.id) ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
