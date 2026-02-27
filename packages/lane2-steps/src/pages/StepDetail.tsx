import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageContainer,
  Card,
  CardContent,
  Badge,
  Button,
  Textarea,
  useAuth,
  useCollection,
} from '@reprieve/shared';
import { where } from 'firebase/firestore';
import { setDocument } from '@reprieve/shared/services/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import type { UserProgress } from '@reprieve/shared';
import {
  BookOpen,
  Lock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Clock,
  Send,
  Lightbulb,
  MessageSquare,
  Trophy,
} from 'lucide-react';
import { getStepContent } from '../data/stepContent';
import type { LessonContent, StepContent } from '../data/stepContent';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonProgress {
  readonly lessonId: string;
  readonly completed: boolean;
  readonly reflectionText: string;
  readonly completedAt: Timestamp | null;
}

// ---------------------------------------------------------------------------
// Firestore path builder
// ---------------------------------------------------------------------------

function buildLessonDocId(userId: string, stepId: string, lessonId: string): string {
  return `${userId}_step${stepId}_${lessonId}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-slate-100 rounded-xl w-3/4" />
      <div className="h-4 bg-slate-100 rounded w-1/2" />
      <div className="h-3 bg-slate-100 rounded-full w-full mt-4" />
      <div className="space-y-3 mt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Header
// ---------------------------------------------------------------------------

interface StepHeaderProps {
  readonly step: StepContent;
  readonly completionPercentage: number;
  readonly allLessonsComplete: boolean;
  readonly stepMarkedComplete: boolean;
  readonly onMarkStepComplete: () => void;
  readonly onGoBack: () => void;
}

function StepHeader({
  step,
  completionPercentage,
  allLessonsComplete,
  stepMarkedComplete,
  onMarkStepComplete,
  onGoBack,
}: StepHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Navigation */}
      <button
        onClick={onGoBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Steps
      </button>

      {/* Title area */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-lg text-blue-700 shrink-0">
              {step.stepNumber}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Step {step.stepNumber}: {step.title}
              </h1>
              <p className="text-sm text-slate-500">{step.tagline}</p>
            </div>
          </div>
        </div>
        {stepMarkedComplete && (
          <Badge variant="success" className="shrink-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-slate-500">Progress</span>
          <span className="font-semibold text-blue-700">{completionPercentage}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Mark Complete button */}
      {allLessonsComplete && !stepMarkedComplete && (
        <Button onClick={onMarkStepComplete} className="w-full" size="lg">
          <Trophy className="h-4 w-4 mr-2" />
          Mark Step Complete
        </Button>
      )}

      {/* Step description */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800 font-medium mb-1">
            Principle: {step.principle}
          </p>
          <p className="text-sm text-blue-700 leading-relaxed">{step.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lesson Card (in the list)
// ---------------------------------------------------------------------------

interface LessonCardProps {
  readonly lesson: LessonContent;
  readonly isActive: boolean;
  readonly isLocked: boolean;
  readonly isCompleted: boolean;
  readonly onSelect: () => void;
}

function LessonCard({
  lesson,
  isActive,
  isLocked,
  isCompleted,
  onSelect,
}: LessonCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={isLocked}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isLocked
          ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
          : isActive
            ? 'bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-200'
            : isCompleted
              ? 'bg-white border-slate-200 hover:bg-slate-50'
              : 'bg-white border-slate-200 hover:bg-blue-50 hover:border-blue-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <div
          className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
            isCompleted
              ? 'bg-green-100'
              : isLocked
                ? 'bg-slate-100'
                : isActive
                  ? 'bg-blue-100'
                  : 'bg-slate-100'
          }`}
        >
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : isLocked ? (
            <Lock className="h-4 w-4 text-slate-400" />
          ) : (
            <span className="text-sm font-bold text-blue-700">
              {lesson.lessonNumber}
            </span>
          )}
        </div>

        {/* Lesson info */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${
              isCompleted
                ? 'text-slate-400 line-through'
                : isLocked
                  ? 'text-slate-400'
                  : 'text-slate-800'
            }`}
          >
            {lesson.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <Clock className="h-3 w-3" />
            <span>{lesson.estimatedMinutes} min</span>
            {isActive && (
              <>
                <span className="inline-block h-1 w-1 rounded-full bg-blue-400" />
                <span className="text-blue-600 font-medium">Active</span>
              </>
            )}
          </div>
        </div>

        {/* Expand indicator */}
        {!isLocked && (
          <div className="shrink-0 text-slate-400">
            {isActive ? (
              <ChevronUp className="h-5 w-5 text-blue-500" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Active Lesson Content (expanded view)
// ---------------------------------------------------------------------------

interface ActiveLessonViewProps {
  readonly lesson: LessonContent;
  readonly reflectionText: string;
  readonly isCompleted: boolean;
  readonly saving: boolean;
  readonly onReflectionChange: (text: string) => void;
  readonly onSaveReflection: () => void;
  readonly onCompleteLesson: () => void;
}

function ActiveLessonView({
  lesson,
  reflectionText,
  isCompleted,
  saving,
  onReflectionChange,
  onSaveReflection,
  onCompleteLesson,
}: ActiveLessonViewProps) {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Content blocks */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-slate-800">{lesson.title}</h3>
          </div>
          {lesson.contentBlocks.map((block, idx) => (
            <p key={idx} className="text-sm text-slate-700 leading-relaxed">
              {block}
            </p>
          ))}
        </CardContent>
      </Card>

      {/* Reflection prompts */}
      <Card className="border-blue-200">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold text-slate-800 text-sm">Reflection</h4>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 space-y-2">
            {lesson.reflectionPrompts.map((prompt, idx) => (
              <p key={idx} className="text-sm text-blue-800">
                {idx + 1}. {prompt}
              </p>
            ))}
          </div>
          <Textarea
            value={reflectionText}
            onChange={(e) => onReflectionChange(e.target.value)}
            placeholder="Write your thoughts here... Take your time and be honest with yourself."
            rows={6}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {reflectionText.length} characters
            </span>
            <Button
              onClick={onSaveReflection}
              disabled={reflectionText.trim().length === 0 || saving}
              size="sm"
              variant="outline"
            >
              <Send className="h-3 w-3 mr-1" />
              {saving ? 'Saving...' : 'Save Reflection'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key takeaways */}
      <Card className="bg-emerald-50/50 border-emerald-200">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-emerald-600" />
            <h4 className="font-semibold text-slate-800 text-sm">Key Takeaways</h4>
          </div>
          <ul className="space-y-2">
            {lesson.keyTakeaways.map((takeaway, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-emerald-800"
              >
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Complete Lesson button */}
      {!isCompleted && (
        <Button onClick={onCompleteLesson} className="w-full" disabled={saving}>
          <CheckCircle className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Complete Lesson'}
        </Button>
      )}

      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <CheckCircle className="h-7 w-7 text-green-600 mx-auto mb-2" />
          <p className="font-semibold text-green-800">Lesson Complete</p>
          <p className="text-sm text-green-600 mt-0.5">
            Great work! Continue to the next lesson.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main StepDetail Page
// ---------------------------------------------------------------------------

export default function StepDetail() {
  const { stepId } = useParams<{ stepId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const stepNumber = parseInt(stepId ?? '0', 10);
  const step = useMemo(() => getStepContent(stepNumber), [stepNumber]);

  // Active lesson selection
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  // Reflection text keyed by lessonId (local draft state)
  const [reflections, setReflections] = useState<Record<string, string>>({});

  // Saving state
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null);

  // Step-level completion marker
  const [stepMarkedComplete, setStepMarkedComplete] = useState(false);

  // ---------- Firestore: fetch lesson progress ----------
  const { data: progressDocs, loading: progressLoading } = useCollection<UserProgress>(
    'user_progress',
    where('userId', '==', uid ?? ''),
    where('courseId', '==', `step${stepNumber}`)
  );

  // Build a map of lessonId -> progress
  const progressMap = useMemo(() => {
    const map = new Map<string, LessonProgress>();
    progressDocs?.forEach((doc) => {
      map.set(doc.moduleId, {
        lessonId: doc.moduleId,
        completed: doc.status === 'completed',
        reflectionText: doc.reflectionText ?? '',
        completedAt: doc.completedAt ?? null,
      });
    });
    return map;
  }, [progressDocs]);

  // Populate reflection drafts from Firestore on load
  useEffect(() => {
    if (progressDocs && progressDocs.length > 0) {
      const loaded: Record<string, string> = {};
      progressDocs.forEach((doc) => {
        if (doc.reflectionText) {
          loaded[doc.moduleId] = doc.reflectionText;
        }
      });
      setReflections((prev) => ({ ...loaded, ...prev }));
    }
  }, [progressDocs]);

  // ---------- Derived state ----------

  const lessons = step?.lessons ?? [];

  const lessonCompletionStates = useMemo(() => {
    return lessons.map((lesson) => {
      const progress = progressMap.get(lesson.id);
      return {
        lessonId: lesson.id,
        completed: progress?.completed ?? false,
      };
    });
  }, [lessons, progressMap]);

  const completedCount = lessonCompletionStates.filter((l) => l.completed).length;
  const totalLessons = lessons.length;
  const completionPercentage =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const allLessonsComplete = completedCount === totalLessons && totalLessons > 0;

  // Determine which lessons are locked (sequential unlock)
  const isLessonLocked = useCallback(
    (lessonIndex: number): boolean => {
      if (lessonIndex === 0) return false;
      const prevCompletion = lessonCompletionStates[lessonIndex - 1];
      return !prevCompletion?.completed;
    },
    [lessonCompletionStates]
  );

  const isLessonCompleted = useCallback(
    (lessonId: string): boolean => {
      return progressMap.get(lessonId)?.completed ?? false;
    },
    [progressMap]
  );

  // Auto-select first uncompleted lesson on load
  useEffect(() => {
    if (!step || progressLoading || activeLessonId) return;
    const firstIncomplete = lessons.findIndex(
      (l, idx) => !isLessonCompleted(l.id) && !isLessonLocked(idx)
    );
    if (firstIncomplete >= 0) {
      setActiveLessonId(lessons[firstIncomplete].id);
    }
  }, [step, progressLoading, activeLessonId, lessons, isLessonCompleted, isLessonLocked]);

  // ---------- Handlers ----------

  const handleSelectLesson = useCallback(
    (lessonId: string) => {
      setActiveLessonId((prev) => (prev === lessonId ? null : lessonId));
    },
    []
  );

  const handleReflectionChange = useCallback(
    (lessonId: string, text: string) => {
      setReflections((prev) => ({ ...prev, [lessonId]: text }));
    },
    []
  );

  const handleSaveReflection = useCallback(
    async (lessonId: string) => {
      if (!uid) return;
      setSavingLessonId(lessonId);
      try {
        const docId = buildLessonDocId(uid, String(stepNumber), lessonId);
        await setDocument('user_progress', docId, {
          userId: uid,
          courseId: `step${stepNumber}`,
          moduleId: lessonId,
          reflectionText: reflections[lessonId] ?? '',
          status: isLessonCompleted(lessonId) ? 'completed' : 'in_progress',
          updatedAt: Timestamp.now(),
        });
      } catch (err) {
        console.error('Failed to save reflection:', err);
      } finally {
        setSavingLessonId(null);
      }
    },
    [uid, stepNumber, reflections, isLessonCompleted]
  );

  const handleCompleteLesson = useCallback(
    async (lessonId: string) => {
      if (!uid) return;
      setSavingLessonId(lessonId);
      try {
        const docId = buildLessonDocId(uid, String(stepNumber), lessonId);
        await setDocument('user_progress', docId, {
          userId: uid,
          courseId: `step${stepNumber}`,
          moduleId: lessonId,
          reflectionText: reflections[lessonId] ?? '',
          status: 'completed',
          completedAt: Timestamp.now(),
        });

        // Auto-advance to the next lesson
        const currentIdx = lessons.findIndex((l) => l.id === lessonId);
        const nextLesson = lessons[currentIdx + 1];
        if (nextLesson) {
          setActiveLessonId(nextLesson.id);
        } else {
          setActiveLessonId(null);
        }
      } catch (err) {
        console.error('Failed to complete lesson:', err);
      } finally {
        setSavingLessonId(null);
      }
    },
    [uid, stepNumber, reflections, lessons]
  );

  const handleMarkStepComplete = useCallback(async () => {
    if (!uid) return;
    try {
      await setDocument('user_step_completions', `${uid}_step${stepNumber}`, {
        userId: uid,
        stepNumber,
        completedAt: Timestamp.now(),
      });
      setStepMarkedComplete(true);
    } catch (err) {
      console.error('Failed to mark step complete:', err);
    }
  }, [uid, stepNumber]);

  const handleGoBack = useCallback(() => {
    navigate('/steps');
  }, [navigate]);

  // ---------- Render ----------

  if (!step) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-700">Step Not Found</h2>
          <p className="text-sm text-slate-500 mt-1">
            The step you are looking for does not exist.
          </p>
          <Button onClick={handleGoBack} variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Steps
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (progressLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton />
      </PageContainer>
    );
  }

  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? null;

  return (
    <PageContainer>
      {/* Step Header */}
      <StepHeader
        step={step}
        completionPercentage={completionPercentage}
        allLessonsComplete={allLessonsComplete}
        stepMarkedComplete={stepMarkedComplete}
        onMarkStepComplete={handleMarkStepComplete}
        onGoBack={handleGoBack}
      />

      {/* Lesson List */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-700">
          Lessons ({completedCount}/{totalLessons})
        </h2>

        {lessons.map((lesson, index) => {
          const locked = isLessonLocked(index);
          const completed = isLessonCompleted(lesson.id);
          const isActive = activeLessonId === lesson.id;

          return (
            <div key={lesson.id} className="space-y-3">
              <LessonCard
                lesson={lesson}
                isActive={isActive}
                isLocked={locked}
                isCompleted={completed}
                onSelect={() => handleSelectLesson(lesson.id)}
              />

              {/* Expanded lesson content */}
              {isActive && activeLesson && (
                <ActiveLessonView
                  lesson={activeLesson}
                  reflectionText={reflections[lesson.id] ?? ''}
                  isCompleted={completed}
                  saving={savingLessonId === lesson.id}
                  onReflectionChange={(text) =>
                    handleReflectionChange(lesson.id, text)
                  }
                  onSaveReflection={() => handleSaveReflection(lesson.id)}
                  onCompleteLesson={() => handleCompleteLesson(lesson.id)}
                />
              )}
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
