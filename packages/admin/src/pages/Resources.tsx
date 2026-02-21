import { useState, useMemo, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
  Badge, Button, Input, Textarea,
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter,
  useCollection,
  formatDate, cn,
} from '@reprieve/shared';
import type { Resource, ResourceType } from '@reprieve/shared';
import {
  Search, Plus, Edit, Trash2, MapPin, Phone, Globe,
  Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  BedDouble, Footprints,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  shelter: 'Shelter',
  food: 'Food Bank',
  medical: 'Medical',
  mental_health: 'Mental Health',
  legal: 'Legal Aid',
  employment: 'Employment',
  transportation: 'Transportation',
  clothing: 'Clothing',
  showers: 'Showers',
  phone_internet: 'Phone/Internet',
  other: 'Other',
};

const RESOURCE_TYPE_OPTIONS: { value: ResourceType; label: string }[] = Object.entries(
  RESOURCE_TYPE_LABELS,
).map(([value, label]) => ({ value: value as ResourceType, label }));

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

type SortField = 'name' | 'type' | 'lastVerified';
type SortDir = 'asc' | 'desc';

function compareResource(a: Resource, b: Resource, field: SortField, dir: SortDir): number {
  let cmp = 0;
  switch (field) {
    case 'name':
      cmp = a.name.localeCompare(b.name);
      break;
    case 'type':
      cmp = a.type.localeCompare(b.type);
      break;
    case 'lastVerified': {
      const da = a.lastVerified?.toMillis?.() ?? 0;
      const db = b.lastVerified?.toMillis?.() ?? 0;
      cmp = da - db;
      break;
    }
  }
  return dir === 'asc' ? cmp : -cmp;
}

// ---------------------------------------------------------------------------
// Add/Edit Form Dialog
// ---------------------------------------------------------------------------

interface ResourceFormProps {
  readonly open: boolean;
  readonly resource: Resource | null;
  readonly onClose: () => void;
  readonly onSave: () => void;
}

function ResourceFormDialog({ open, resource, onClose, onSave }: ResourceFormProps) {
  const isEdit = resource !== null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-stone-700">Name</label>
              <Input defaultValue={resource?.name ?? ''} placeholder="Resource name" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">Type</label>
              <select
                defaultValue={resource?.type ?? 'shelter'}
                className="mt-1 w-full h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm"
              >
                {RESOURCE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">Phone</label>
              <Input defaultValue={resource?.phone ?? ''} placeholder="(555) 123-4567" className="mt-1" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-stone-700">Address</label>
              <Input defaultValue={resource?.address ?? ''} placeholder="Full address" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">Website</label>
              <Input defaultValue={resource?.website ?? ''} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">Hours</label>
              <Input defaultValue={resource?.hours ?? ''} placeholder="Mon-Fri 9am-5pm" className="mt-1" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-stone-700">Description</label>
              <Textarea
                defaultValue={resource?.description ?? ''}
                placeholder="Description of services offered..."
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-stone-700">Services (comma-separated)</label>
              <Input
                defaultValue={resource?.services?.join(', ') ?? ''}
                placeholder="counseling, housing, food"
                className="mt-1"
              />
            </div>

            {/* Availability */}
            <div>
              <label className="text-sm font-medium text-stone-700">Total Beds</label>
              <Input
                type="number"
                defaultValue={resource?.availability?.beds?.total ?? ''}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">Available Beds</label>
              <Input
                type="number"
                defaultValue={resource?.availability?.beds?.available ?? ''}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked={resource?.availability?.walkIn ?? false}
                  className="rounded border-stone-300"
                />
                <span className="text-sm text-stone-700">Accepts walk-ins</span>
              </label>
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onSave}>{isEdit ? 'Save Changes' : 'Add Resource'}</Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirm Dialog
// ---------------------------------------------------------------------------

interface DeleteConfirmProps {
  readonly open: boolean;
  readonly resourceName: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

function DeleteConfirmDialog({ open, resourceName, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogHeader>
        <DialogTitle>Delete Resource</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <p className="text-sm text-stone-600">
          Are you sure you want to delete <strong>{resourceName}</strong>? This action cannot be undone.
        </p>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="destructive" onClick={onConfirm}>Delete</Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Sortable Header
// ---------------------------------------------------------------------------

function SortHeader({
  label,
  field,
  currentField,
  dir,
  onSort,
}: {
  readonly label: string;
  readonly field: SortField;
  readonly currentField: SortField;
  readonly dir: SortDir;
  readonly onSort: (f: SortField) => void;
}) {
  const isActive = currentField === field;
  return (
    <button
      className="flex items-center gap-1 text-xs font-semibold text-stone-500 uppercase hover:text-stone-700"
      onClick={() => onSort(field)}
    >
      {label}
      {isActive && (dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function Resources() {
  const { data: resources, loading } = useCollection<Resource>('resources');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | ''>('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return resources
      .filter((r) => {
        if (q && !r.name.toLowerCase().includes(q) && !r.address.toLowerCase().includes(q)) return false;
        if (typeFilter && r.type !== typeFilter) return false;
        return true;
      })
      .sort((a, b) => compareResource(a, b, sortField, sortDir));
  }, [resources, search, typeFilter, sortField, sortDir]);

  const openEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormOpen(true);
  };

  const openAdd = () => {
    setEditingResource(null);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-36 bg-stone-200 rounded animate-pulse" />
        <div className="h-96 bg-stone-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Resources</h1>
          <p className="text-sm text-stone-500">{resources.length} community resources</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Resource
        </Button>
      </div>

      {/* Search + Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search by name or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ResourceType | '')}
              className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700"
            >
              <option value="">All Types</option>
              {RESOURCE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="p-4 text-left">
                    <SortHeader label="Name" field="name" currentField={sortField} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="p-4 text-left">
                    <SortHeader label="Type" field="type" currentField={sortField} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-xs font-semibold text-stone-500 uppercase">Address</span>
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-xs font-semibold text-stone-500 uppercase">Hours</span>
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-xs font-semibold text-stone-500 uppercase">Availability</span>
                  </th>
                  <th className="p-4 text-left">
                    <SortHeader label="Verified" field="lastVerified" currentField={sortField} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="p-4 w-20" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">
                      No resources match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((resource) => {
                    const daysSinceVerified = resource.lastVerified
                      ? Math.floor(
                          (Date.now() - resource.lastVerified.toDate().getTime()) /
                            (1000 * 60 * 60 * 24),
                        )
                      : Infinity;
                    const isStale = daysSinceVerified > 90;

                    return (
                      <tr
                        key={resource.id}
                        className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                      >
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-medium text-stone-700">{resource.name}</p>
                            {resource.phone && (
                              <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" />
                                {resource.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">
                            {RESOURCE_TYPE_LABELS[resource.type]}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-stone-600 max-w-[200px] truncate flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                            {resource.address}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-stone-600 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-stone-400" />
                            {resource.hours}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-xs">
                            {resource.availability?.beds && (
                              <span className="flex items-center gap-1 text-stone-600">
                                <BedDouble className="h-3.5 w-3.5" />
                                {resource.availability.beds.available}/{resource.availability.beds.total}
                              </span>
                            )}
                            {resource.availability?.walkIn && (
                              <Badge variant="success">Walk-in</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            {isStale ? (
                              <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            )}
                            <span className={cn('text-xs', isStale ? 'text-orange-600' : 'text-stone-600')}>
                              {formatDate(resource.lastVerified)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(resource)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteTarget(resource)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Map Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-stone-400" />
            Resource Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 text-sm">
            Map integration will display resource markers here (Google Maps API)
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ResourceFormDialog
        open={formOpen}
        resource={editingResource}
        onClose={() => {
          setFormOpen(false);
          setEditingResource(null);
        }}
        onSave={() => {
          setFormOpen(false);
          setEditingResource(null);
        }}
      />

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          open
          resourceName={deleteTarget.name}
          onConfirm={() => setDeleteTarget(null)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
