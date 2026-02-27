import { useState, useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Input,
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter,
  useCollection,
  cn,
} from '@reprieve/shared';
import type { Course, CourseModule, UserProgress } from '@reprieve/shared';
import {
  BookOpen, Play, FileText, MessageSquare, CheckSquare,
  Edit, ChevronRight, ChevronLeft, Upload, Users,
  Clock, Award, TrendingUp, BarChart3,
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

// ---------------------------------------------------------------------------
// Course Card
// ---------------------------------------------------------------------------

interface CourseCardProps {
  readonly course: Course;
  readonly completionRate: number;
  readonly enrolledCount: number;
  readonly onClick: () => void;
}

function CourseCard({ course, completionRate, enrolledCount, onClick }: CourseCardProps) {
  return (
    <Card
      className="hover:border-blue-300 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-blue-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800 truncate">{course.title}</h3>
                <Badge variant={course.isPublished ? 'success' : 'secondary'}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{course.description}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-300 shrink-0 ml-2" />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">{course.modules.length}</p>
            <p className="text-xs text-slate-500">Modules</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">{enrolledCount}</p>
            <p className="text-xs text-slate-500">Enrolled</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">{completionRate}%</p>
            <p className="text-xs text-slate-500">Completion</p>
          </div>
        </div>

        {/* Completion bar */}
        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
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
}

function CourseDetail({ course, progressData, onBack }: CourseDetailProps) {
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);

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
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to courses
      </button>

      {/* Course Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">{course.title}</h2>
            <Badge variant={course.isPublished ? 'success' : 'secondary'}>
              {course.isPublished ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">{course.description}</p>
          <p className="text-xs text-slate-400 mt-1">
            Step {course.stepNumber} &middot; {course.modules.length} modules &middot;{' '}
            {Math.round(course.totalDuration / 60)} min total
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1.5" />
          Edit Course
        </Button>
      </div>

      {/* Engagement Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-400" />
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
                <Bar dataKey="completed" fill="#2563eb" name="Completed" radius={[4, 4, 0, 0]} />
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
                  className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{mod.title}</p>
                    <p className="text-xs text-slate-500 capitalize">{mod.type} &middot; {mod.duration} min</p>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-500">
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
                <label className="text-sm font-medium text-slate-700">Title</label>
                <Input defaultValue={editingModule.title} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Type</label>
                <select
                  defaultValue={editingModule.type}
                  className="mt-1 w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="video">Video</option>
                  <option value="reading">Reading</option>
                  <option value="assessment">Assessment</option>
                  <option value="reflection">Reflection</option>
                  <option value="discussion">Discussion</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Duration (minutes)</label>
                <Input type="number" defaultValue={editingModule.duration} className="mt-1" />
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModule(null)}>Cancel</Button>
            <Button onClick={() => setEditingModule(null)}>Save Changes</Button>
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

  if (coursesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-36 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (selectedCourse) {
    const courseProgress = progress.filter((p) => p.courseId === selectedCourse.id);
    return (
      <CourseDetail
        course={selectedCourse}
        progressData={courseProgress}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Courses</h1>
          <p className="text-sm text-slate-500">
            12-Step curriculum management &middot; {courses.length} courses
          </p>
        </div>
        <Button size="sm">
          <BookOpen className="h-4 w-4 mr-1.5" />
          Add Course
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{courses.length}</p>
              <p className="text-xs text-slate-500">Total Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">
                {courses.filter((c) => c.isPublished).length}
              </p>
              <p className="text-xs text-slate-500">Published</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">
                {new Set(progress.map((p) => p.userId)).size}
              </p>
              <p className="text-xs text-slate-500">Total Enrolled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">
                {progress.filter((p) => p.status === 'completed').length}
              </p>
              <p className="text-xs text-slate-500">Completions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coursesWithStats.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No courses yet. Create your first course to get started.</p>
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
            />
          ))
        )}
      </div>
    </div>
  );
}
