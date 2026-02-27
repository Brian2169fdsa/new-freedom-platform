import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Input, Textarea,
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter,
  useCollection,
  cn,
} from '@reprieve/shared';
import { addDocument, updateDocument, deleteDocument } from '@reprieve/shared/services/firebase/firestore';
import type { Course, CourseModule, UserProgress } from '@reprieve/shared';
import {
  BookOpen, Play, FileText, MessageSquare, CheckSquare,
  Edit, ChevronRight, ChevronLeft, Upload, Users,
  Clock, Award, TrendingUp, BarChart3, Plus, Trash2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODULE_ICONS: Record<string, React.ElementType> = {
  video: Play,
  reading: FileText,
  assessment: CheckSquare,
  reflection: Edit,
  discussion: MessageSquare,
};

const MODULE_TYPES: CourseModule['type'][] = ['video', 'reading', 'assessment', 'reflection', 'discussion'];

// ---------------------------------------------------------------------------
// Course Form Dialog (Create + Edit)
// ---------------------------------------------------------------------------

function CourseFormDialog({
  open,
  course,
  onClose,
  onSave,
  saving,
}: {
  readonly open: boolean;
  readonly course: Course | null;
  readonly onClose: () => void;
  readonly onSave: (data: Omit<Course, 'id'>) => Promise<void>;
  readonly saving: boolean;
}) {
  const isEdit = course !== null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepNumber, setStepNumber] = useState(1);
  const [order, setOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [modules, setModules] = useState<CourseModule[]>([]);

  useEffect(() => {
    setTitle(course?.title ?? '');
    setDescription(course?.description ?? '');
    setStepNumber(course?.stepNumber ?? 1);
    setOrder(course?.order ?? 0);
    setIsPublished(course?.isPublished ?? false);
    setModules(course?.modules ?? []);
  }, [course]);

  const addModule = () => {
    setModules((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        courseId: course?.id ?? '',
        title: '',
        type: 'reading',
        content: {},
        duration: 15,
        order: prev.length + 1,
      },
    ]);
  };

  const updateModule = (index: number, updates: Partial<CourseModule>) => {
    setModules((prev) => prev.map((m, i) => (i === index ? { ...m, ...updates } : m)));
  };

  const removeModule = (index: number) => {
    setModules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const totalDuration = modules.reduce((sum, m) => sum + (m.duration || 0), 0);
    onSave({
      title,
      description,
      stepNumber,
      order,
      isPublished,
      modules: modules.map((m, i) => ({ ...m, order: i + 1 })),
      totalDuration,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Course' : 'Add Course'}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="text-sm font-medium text-stone-700">Title</label>
            <Input
              placeholder="Course title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Description</label>
            <Textarea
              placeholder="Course description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-stone-700">Step Number (1-12)</label>
              <Input
                type="number"
                min={1}
                max={12}
                value={stepNumber}
                onChange={(e) => setStepNumber(Number(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">Order</label>
              <Input
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-stone-300"
            />
            <span className="text-sm text-stone-700">Published</span>
          </label>

          {/* Module Management */}
          <div className="border-t border-stone-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-stone-700">Modules ({modules.length})</p>
              <Button size="sm" variant="outline" onClick={addModule}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Module
              </Button>
            </div>
            <div className="space-y-3">
              {modules.map((mod, index) => (
                <div key={mod.id} className="flex items-start gap-2 p-3 border border-stone-200 rounded-lg bg-stone-50">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Module title"
                      value={mod.title}
                      onChange={(e) => updateModule(index, { title: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <select
                        value={mod.type}
                        onChange={(e) => updateModule(index, { type: e.target.value as CourseModule['type'] })}
                        className="h-9 rounded-lg border border-stone-300 bg-white px-3 text-sm flex-1"
                      >
                        {MODULE_TYPES.map((t) => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min={1}
                        value={mod.duration}
                        onChange={(e) => updateModule(index, { duration: Number(e.target.value) || 1 })}
                        className="w-24"
                        placeholder="min"
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 mt-1"
                    onClick={() => removeModule(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {modules.length === 0 && (
                <p className="text-xs text-stone-400 text-center py-4">
                  No modules yet. Click "Add Module" to create one.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Course'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirm Dialog
// ---------------------------------------------------------------------------

function DeleteCourseDialog({
  open,
  courseName,
  onConfirm,
  onCancel,
}: {
  readonly open: boolean;
  readonly courseName: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogHeader>
        <DialogTitle>Delete Course</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <p className="text-sm text-stone-600">
          Are you sure you want to delete <strong>{courseName}</strong>? This will remove the course and all its modules. This action cannot be undone.
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
// Course Card
// ---------------------------------------------------------------------------

interface CourseCardProps {
  readonly course: Course;
  readonly completionRate: number;
  readonly enrolledCount: number;
  readonly onClick: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onTogglePublish: () => void;
}

function CourseCard({ course, completionRate, enrolledCount, onClick, onEdit, onDelete, onTogglePublish }: CourseCardProps) {
  return (
    <Card
      className="hover:border-amber-300 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-800 truncate">{course.title}</h3>
                <button
                  onClick={(e) => { e.stopPropagation(); onTogglePublish(); }}
                  className="shrink-0"
                >
                  <Badge variant={course.isPublished ? 'success' : 'secondary'} className="cursor-pointer hover:opacity-80">
                    {course.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </button>
              </div>
              <p className="text-sm text-stone-500 mt-0.5 line-clamp-1">{course.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-lg font-bold text-stone-800">{course.modules.length}</p>
            <p className="text-xs text-stone-500">Modules</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-stone-800">{enrolledCount}</p>
            <p className="text-xs text-stone-500">Enrolled</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-stone-800">{completionRate}%</p>
            <p className="text-xs text-stone-500">Completion</p>
          </div>
        </div>

        {/* Completion bar */}
        <div className="mt-3 h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-600 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Course Detail / Module Editor
// ---------------------------------------------------------------------------

interface CourseDetailProps {
  readonly course: Course;
  readonly progressData: readonly UserProgress[];
  readonly onBack: () => void;
  readonly onEdit: () => void;
  readonly onSaveModule: (moduleId: string, updates: Partial<CourseModule>) => Promise<void>;
}

function CourseDetail({ course, progressData, onBack, onEdit, onSaveModule }: CourseDetailProps) {
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleType, setModuleType] = useState<CourseModule['type']>('reading');
  const [moduleDuration, setModuleDuration] = useState(15);
  const [moduleSaving, setModuleSaving] = useState(false);

  useEffect(() => {
    if (editingModule) {
      setModuleTitle(editingModule.title);
      setModuleType(editingModule.type);
      setModuleDuration(editingModule.duration);
    }
  }, [editingModule]);

  const handleSaveModule = async () => {
    if (!editingModule) return;
    setModuleSaving(true);
    try {
      await onSaveModule(editingModule.id, {
        title: moduleTitle,
        type: moduleType,
        duration: moduleDuration,
      });
      setEditingModule(null);
    } catch (err) {
      console.error('Failed to save module:', err);
    } finally {
      setModuleSaving(false);
    }
  };

  const moduleStats = useMemo(() => {
    return course.modules.map((mod) => {
      const moduleProgress = progressData.filter((p) => p.moduleId === mod.id);
      const started = moduleProgress.length;
      const completed = moduleProgress.filter((p) => p.status === 'completed').length;
      const avgScore = moduleProgress.reduce(
        (sum, p) => sum + (p.assessmentScore ?? 0),
        0,
      ) / (moduleProgress.filter((p) => p.assessmentScore != null).length || 1);

      return {
        ...mod,
        started,
        completed,
        dropped: started - completed,
        avgScore: Math.round(avgScore),
        avgTime: mod.duration,
      };
    });
  }, [course.modules, progressData]);

  const engagementData = moduleStats.map((ms) => ({
    name: `M${ms.order}`,
    started: ms.started,
    completed: ms.completed,
    dropped: ms.dropped,
  }));

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to courses
      </button>

      {/* Course Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-stone-800">{course.title}</h2>
            <Badge variant={course.isPublished ? 'success' : 'secondary'}>
              {course.isPublished ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <p className="text-sm text-stone-500 mt-1">{course.description}</p>
          <p className="text-xs text-stone-400 mt-1">
            Step {course.stepNumber} &middot; {course.modules.length} modules &middot;{' '}
            {Math.round(course.totalDuration / 60)} min total
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-1.5" />
          Edit Course
        </Button>
      </div>

      {/* Engagement Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-stone-400" />
            Module Engagement
          </CardTitle>
          <CardDescription>Users started vs. completed per module</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#a8a29e" />
                <YAxis tick={{ fontSize: 12 }} stroke="#a8a29e" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e7e5e4',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="started" fill="#d6d3d1" name="Started" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#b45309" name="Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Module List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Modules</CardTitle>
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-1.5" />
              Upload Video
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {moduleStats.map((mod) => {
              const Icon = MODULE_ICONS[mod.type] ?? FileText;
              return (
                <div
                  key={mod.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-stone-100 hover:bg-stone-50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-stone-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-700">{mod.title}</p>
                    <p className="text-xs text-stone-500 capitalize">{mod.type} &middot; {mod.duration} min</p>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-stone-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{mod.avgTime}m avg</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      <span>{mod.avgScore}% avg</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{mod.completed}/{mod.started}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingModule(mod)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Module Dialog */}
      {editingModule && (
        <Dialog open onOpenChange={() => setEditingModule(null)}>
          <DialogHeader>
            <DialogTitle>Edit Module: {editingModule.title}</DialogTitle>
          </DialogHeader>
          <DialogContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700">Title</label>
                <Input
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">Type</label>
                <select
                  value={moduleType}
                  onChange={(e) => setModuleType(e.target.value as CourseModule['type'])}
                  className="mt-1 w-full h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm"
                >
                  {MODULE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">Duration (minutes)</label>
                <Input
                  type="number"
                  value={moduleDuration}
                  onChange={(e) => setModuleDuration(Number(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModule(null)}>Cancel</Button>
            <Button onClick={handleSaveModule} disabled={moduleSaving}>
              {moduleSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function Courses() {
  const { data: courses, loading: coursesLoading } = useCollection<Course>('courses');
  const { data: progress } = useCollection<UserProgress>('userProgress');

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  // Keep selectedCourse in sync with real-time data
  const currentSelectedCourse = useMemo(() => {
    if (!selectedCourse) return null;
    return courses.find((c) => c.id === selectedCourse.id) ?? null;
  }, [selectedCourse, courses]);

  const coursesWithStats = useMemo(() => {
    return courses
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map((course) => {
        const courseProgress = progress.filter((p) => p.courseId === course.id);
        const uniqueUsers = new Set(courseProgress.map((p) => p.userId));
        const completedUsers = new Set(
          courseProgress
            .filter((p) => p.status === 'completed')
            .map((p) => p.userId),
        );
        const enrolled = uniqueUsers.size;
        const rate = enrolled > 0 ? Math.round((completedUsers.size / enrolled) * 100) : 0;
        return { course, enrolled, completionRate: rate };
      });
  }, [courses, progress]);

  // CRUD handlers
  const handleSaveCourse = async (data: Omit<Course, 'id'>) => {
    setSaving(true);
    try {
      if (editingCourse) {
        await updateDocument('courses', editingCourse.id, data);
      } else {
        await addDocument('courses', data);
      }
      setFormOpen(false);
      setEditingCourse(null);
    } catch (err) {
      console.error('Failed to save course:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('courses', deleteTarget.id);
      if (selectedCourse?.id === deleteTarget.id) {
        setSelectedCourse(null);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      await updateDocument('courses', course.id, {
        isPublished: !course.isPublished,
      });
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const handleSaveModule = async (courseId: string, moduleId: string, updates: Partial<CourseModule>) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const updatedModules = course.modules.map((m) =>
      m.id === moduleId ? { ...m, ...updates } : m,
    );
    const totalDuration = updatedModules.reduce((sum, m) => sum + (m.duration || 0), 0);
    await updateDocument('courses', courseId, { modules: updatedModules, totalDuration });
  };

  const openAdd = () => {
    setEditingCourse(null);
    setFormOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setFormOpen(true);
  };

  if (coursesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-36 bg-stone-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 bg-stone-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (currentSelectedCourse) {
    const courseProgress = progress.filter((p) => p.courseId === currentSelectedCourse.id);
    return (
      <>
        <CourseDetail
          course={currentSelectedCourse}
          progressData={courseProgress}
          onBack={() => setSelectedCourse(null)}
          onEdit={() => openEdit(currentSelectedCourse)}
          onSaveModule={(moduleId, updates) => handleSaveModule(currentSelectedCourse.id, moduleId, updates)}
        />
        <CourseFormDialog
          open={formOpen}
          course={editingCourse}
          onClose={() => { setFormOpen(false); setEditingCourse(null); }}
          onSave={handleSaveCourse}
          saving={saving}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Courses</h1>
          <p className="text-sm text-stone-500">
            12-Step curriculum management &middot; {courses.length} courses
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <BookOpen className="h-4 w-4 mr-1.5" />
          Add Course
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-stone-800">{courses.length}</p>
              <p className="text-xs text-stone-500">Total Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-stone-800">
                {courses.filter((c) => c.isPublished).length}
              </p>
              <p className="text-xs text-stone-500">Published</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-stone-800">
                {new Set(progress.map((p) => p.userId)).size}
              </p>
              <p className="text-xs text-stone-500">Total Enrolled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-stone-800">
                {progress.filter((p) => p.status === 'completed').length}
              </p>
              <p className="text-xs text-stone-500">Completions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coursesWithStats.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500">No courses yet. Create your first course to get started.</p>
            </CardContent>
          </Card>
        ) : (
          coursesWithStats.map(({ course, enrolled, completionRate }) => (
            <CourseCard
              key={course.id}
              course={course}
              enrolledCount={enrolled}
              completionRate={completionRate}
              onClick={() => setSelectedCourse(course)}
              onEdit={() => openEdit(course)}
              onDelete={() => setDeleteTarget(course)}
              onTogglePublish={() => handleTogglePublish(course)}
            />
          ))
        )}
      </div>

      {/* Course Form Dialog */}
      <CourseFormDialog
        open={formOpen}
        course={editingCourse}
        onClose={() => { setFormOpen(false); setEditingCourse(null); }}
        onSave={handleSaveCourse}
        saving={saving}
      />

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <DeleteCourseDialog
          open
          courseName={deleteTarget.title}
          onConfirm={handleDeleteCourse}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
