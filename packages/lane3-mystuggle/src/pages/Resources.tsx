import React, { useState } from 'react';
import { useCollection, type Resource, type ResourceType } from '@reprieve/shared';
import { where, orderBy } from 'firebase/firestore';
import {
  MapPin, Phone, Clock, ExternalLink, Navigation, Search, AlertTriangle, Bed,
  Utensils, Stethoscope, Brain, Scale, Briefcase, Bus, Droplets, Wifi, HelpCircle,
} from 'lucide-react';

const RESOURCE_CATEGORIES: { type: ResourceType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'shelter', label: 'Shelters', icon: <Bed className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600' },
  { type: 'food', label: 'Food', icon: <Utensils className="h-5 w-5" />, color: 'bg-green-50 text-green-600' },
  { type: 'medical', label: 'Medical', icon: <Stethoscope className="h-5 w-5" />, color: 'bg-red-50 text-red-600' },
  { type: 'mental_health', label: 'Mental Health', icon: <Brain className="h-5 w-5" />, color: 'bg-purple-50 text-purple-600' },
  { type: 'legal', label: 'Legal Aid', icon: <Scale className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600' },
  { type: 'employment', label: 'Jobs', icon: <Briefcase className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600' },
  { type: 'transportation', label: 'Transport', icon: <Bus className="h-5 w-5" />, color: 'bg-sky-50 text-sky-600' },
  { type: 'showers', label: 'Showers', icon: <Droplets className="h-5 w-5" />, color: 'bg-cyan-50 text-cyan-600' },
  { type: 'phone_internet', label: 'Phone/WiFi', icon: <Wifi className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-600' },
  { type: 'other', label: 'Other', icon: <HelpCircle className="h-5 w-5" />, color: 'bg-stone-50 text-stone-600' },
];

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

function ResourceCard({ resource }: { resource: Resource }) {
  const category = RESOURCE_CATEGORIES.find((c) => c.type === resource.type);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resource.address)}`;

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${category?.color || 'bg-stone-50 text-stone-600'}`}>
          {category?.icon || <HelpCircle className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-stone-800 text-sm">{resource.name}</h3>
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

export default function Resources() {
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [search, setSearch] = useState('');

  const constraints = selectedType === 'all'
    ? [orderBy('name')]
    : [where('type', '==', selectedType), orderBy('name')];

  const { data: resources, loading } = useCollection<Resource>('resources', ...constraints);

  const filtered = search
    ? resources.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase())
      )
    : resources;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-stone-800">Resources</h1>
        <p className="text-sm text-stone-500 mt-0.5">Find help near you in Phoenix</p>
      </div>

      <EmergencyBanner />

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
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <MapPin className="h-8 w-8 text-stone-300 mx-auto" />
          <h3 className="font-medium text-stone-800 mt-3">No resources found</h3>
          <p className="text-sm text-stone-500 mt-1">
            {search ? 'Try a different search term' : 'Resources will appear here as they are verified'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-stone-400">{filtered.length} resources found</p>
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}
