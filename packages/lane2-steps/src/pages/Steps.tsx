import { useState, useMemo, useCallback } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Textarea,
  useAuth,
  useCollection,
} from '@reprieve/shared';
import { where, orderBy } from 'firebase/firestore';
import { setDocument } from '@reprieve/shared/services/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import type { Course, CourseModule, UserProgress } from '@reprieve/shared';
import {
  Lock,
  CheckCircle,
  Circle,
  Play,
  BookOpen,
  ClipboardCheck,
  MessageSquareText,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowLeft,
  Send,
} from 'lucide-react';

// Step data - Joe McDonald's curriculum
const STEP_DATA: Array<{
  number: number;
  title: string;
  principle: string;
  description: string;
}> = [
  { number: 1, title: 'Honesty', principle: 'Admitted powerlessness', description: 'We admitted we were powerless over our addiction - that our lives had become unmanageable.' },
  { number: 2, title: 'Hope', principle: 'Came to believe', description: 'Came to believe that a Power greater than ourselves could restore us to sanity.' },
  { number: 3, title: 'Faith', principle: 'Made a decision', description: 'Made a decision to turn our will and our lives over to the care of God as we understood Him.' },
  { number: 4, title: 'Courage', principle: 'Made a searching inventory', description: 'Made a searching and fearless moral inventory of ourselves.' },
  { number: 5, title: 'Integrity', principle: 'Admitted wrongs', description: 'Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.' },
  { number: 6, title: 'Willingness', principle: 'Were entirely ready', description: 'Were entirely ready to have God remove all these defects of character.' },
  { number: 7, title: 'Humility', principle: 'Humbly asked', description: 'Humbly asked Him to remove our shortcomings.' },
  { number: 8, title: 'Brotherly Love', principle: 'Made a list', description: 'Made a list of all persons we had harmed, and became willing to make amends to them all.' },
  { number: 9, title: 'Justice', principle: 'Made amends', description: 'Made direct amends to such people wherever possible, except when to do so would injure them or others.' },
  { number: 10, title: 'Perseverance', principle: 'Continued inventory', description: 'Continued to take personal inventory and when we were wrong promptly admitted it.' },
  { number: 11, title: 'Spiritual Awareness', principle: 'Sought through prayer', description: 'Sought through prayer and meditation to improve our conscious contact with God.' },
  { number: 12, title: 'Service', principle: 'Carried the message', description: 'Having had a spiritual awakening as the result of these Steps, we tried to carry this message and practice these principles in all our affairs.' },
];

const MODULE_TYPE_ICONS: Record<string, typeof Play> = {
  video: Play,
  reading: BookOpen,
  assessment: ClipboardCheck,
  reflection: MessageSquareText,
  discussion: MessageSquareText,
};

const MODULE_TYPE_COLORS: Record<string, string> = {
  video: 'bg-blue-100 text-blue-700',
  reading: 'bg-emerald-100 text-emerald-700',
  assessment: 'bg-purple-100 text-purple-700',
  reflection: 'bg-blue-100 text-blue-700',
  discussion: 'bg-orange-100 text-orange-700',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-slate-100 rounded-xl" />
      ))}
    </div>
  );
}

// --- Module Viewer Components ---

interface VideoViewerProps {
  module: CourseModule;
  progress: UserProgress | undefined;
  onSaveProgress: (videoSeconds: number) => void;
}

function VideoViewer({ module, progress, onSaveProgress }: VideoViewerProps) {
  const [currentTime, setCurrentTime] = useState(progress?.videoProgress ?? 0);

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative">
        {module.content.videoURL ? (
          <video
            src={module.content.videoURL}
            controls
            className="w-full h-full"
            onTimeUpdate={(e) => {
              const time = Math.floor((e.target as HTMLVideoElement).currentTime);
              setCurrentTime(time);
            }}
            onPause={() => onSaveProgress(currentTime)}
            onEnded={() => onSaveProgress(module.duration * 60)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Play className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Video content loading...</p>
              <p className="text-xs mt-1">Check back soon for Joe McDonald's teaching on this step.</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{Math.floor(currentTime / 60)}:{String(currentTime % 60).padStart(2, '0')} watched</span>
        <span>{module.duration} min total</span>
      </div>
    </div>
  );
}

interface ReadingViewerProps {
  module: CourseModule;
}

function ReadingViewer({ module }: ReadingViewerProps) {
  const content = module.content.text;
  return (
    <div className="prose prose-stone prose-sm max-w-none">
      {content ? (
        <div className="whitespace-pre-wrap leading-relaxed text-slate-700">{content}</div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          <BookOpen className="h-10 w-10 mx-auto mb-2" />
          <p>Reading material will be available soon.</p>
        </div>
      )}
    </div>
  );
}

interface AssessmentViewerProps {
  module: CourseModule;
  onSubmitScore: (score: number) => void;
}

function AssessmentViewer({ module, onSubmitScore }: AssessmentViewerProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const questions = useMemo(() => {
    const survey = module.content.surveyJSON as {
      questions?: Array<{ question: string; options: string[]; correct: number }>;
    } | null;
    return survey?.questions ?? [
      { question: 'What is the core principle of this step?', options: ['Understanding', 'Acceptance', 'Action', 'Reflection'], correct: 1 },
      { question: 'How does this step apply to daily recovery?', options: ['By ignoring past mistakes', 'Through honest self-reflection', 'By avoiding all triggers', 'Through isolation'], correct: 1 },
      { question: 'What is the recommended daily practice for this step?', options: ['Journaling and reflection', 'Avoiding all contact', 'Working alone', 'None of the above'], correct: 0 },
    ];
  }, [module.content.surveyJSON]);

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });
    const score = Math.round((correct / questions.length) * 100);
    setSubmitted(true);
    onSubmitScore(score);
  };

  return (
    <div className="space-y-6">
      {questions.map((q, qIdx) => (
        <div key={qIdx} className="space-y-3">
          <p className="font-medium text-slate-800 text-sm">
            {qIdx + 1}. {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oIdx) => {
              const isSelected = answers[qIdx] === oIdx;
              const isCorrect = submitted && oIdx === q.correct;
              const isWrong = submitted && isSelected && oIdx !== q.correct;
              return (
                <button
                  key={oIdx}
                  onClick={() => {
                    if (submitted) return;
                    setAnswers({ ...answers, [qIdx]: oIdx });
                  }}
                  disabled={submitted}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                    isCorrect
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : isWrong
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : isSelected
                          ? 'bg-blue-50 border-blue-300 text-blue-800'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full"
        >
          Submit Assessment
        </Button>
      )}
      {submitted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
          <p className="font-semibold text-emerald-800">Assessment Complete!</p>
          <p className="text-sm text-emerald-600">Your responses have been saved.</p>
        </div>
      )}
    </div>
  );
}

interface ReflectionViewerProps {
  module: CourseModule;
  existingText: string | undefined;
  onSave: (text: string) => void;
}

function ReflectionViewer({ module, existingText, onSave }: ReflectionViewerProps) {
  const [text, setText] = useState(existingText ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 font-medium mb-1">Reflection Prompt</p>
        <p className="text-sm text-blue-700">
          {module.content.text || 'Take a moment to reflect on what this step means to you. How does it relate to your personal journey? What changes do you want to make?'}
        </p>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your reflection here..."
        rows={8}
        className="resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{text.length} characters</span>
        <Button onClick={handleSave} disabled={text.trim().length === 0} size="sm">
          <Send className="h-3 w-3 mr-1" />
          {saved ? 'Saved!' : 'Save Reflection'}
        </Button>
      </div>
    </div>
  );
}

// --- Main Steps Page ---

export default function Steps() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const currentStep = user?.stepExperience?.currentStep ?? 1;

  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [activeModule, setActiveModule] = useState<{ stepNum: number; module: CourseModule } | null>(null);

  // Fetch all courses
  const { data: courses, loading: coursesLoading } = useCollection<Course>(
    'courses',
    where('isPublished', '==', true),
    orderBy('stepNumber', 'asc')
  );

  // Fetch user progress
  const { data: progressData, loading: progressLoading } = useCollection<UserProgress>(
    'user_progress',
    where('userId', '==', uid ?? '')
  );

  // Map courses to steps
  const courseMap = useMemo(() => {
    const map = new Map<number, Course>();
    courses?.forEach((c) => map.set(c.stepNumber, c));
    return map;
  }, [courses]);

  // Progress lookup
  const progressMap = useMemo(() => {
    const map = new Map<string, UserProgress>();
    progressData?.forEach((p) => map.set(`${p.courseId}_${p.moduleId}`, p));
    return map;
  }, [progressData]);

  // Calculate step completion percentages
  const stepProgress = useMemo(() => {
    const result = new Map<number, number>();
    STEP_DATA.forEach((step) => {
      const course = courseMap.get(step.number);
      if (!course || !course.modules || course.modules.length === 0) {
        result.set(step.number, 0);
        return;
      }
      const completed = course.modules.filter((m) => {
        const prog = progressMap.get(`${course.id}_${m.id}`);
        return prog?.status === 'completed';
      }).length;
      result.set(step.number, Math.round((completed / course.modules.length) * 100));
    });
    return result;
  }, [courseMap, progressMap]);

  const getStepStatus = (stepNum: number): 'completed' | 'available' | 'locked' => {
    const pct = stepProgress.get(stepNum) ?? 0;
    if (pct === 100) return 'completed';
    if (stepNum <= currentStep) return 'available';
    const prevPct = stepProgress.get(stepNum - 1) ?? 0;
    if (prevPct === 100) return 'available';
    return 'locked';
  };

  const handleSaveModuleProgress = useCallback(
    async (courseId: string, moduleId: string, data: Partial<UserProgress>) => {
      if (!uid) return;
      const docId = `${uid}_${courseId}_${moduleId}`;
      await setDocument('user_progress', docId, {
        userId: uid,
        courseId,
        moduleId,
        ...data,
        updatedAt: Timestamp.now(),
      });
    },
    [uid]
  );

  const handleCompleteModule = useCallback(
    async (courseId: string, moduleId: string) => {
      if (!uid) return;
      const docId = `${uid}_${courseId}_${moduleId}`;
      await setDocument('user_progress', docId, {
        userId: uid,
        courseId,
        moduleId,
        status: 'completed',
        completedAt: Timestamp.now(),
      });
    },
    [uid]
  );

  const isLoading = coursesLoading || progressLoading;

  // Module Viewer overlay
  if (activeModule) {
    const course = courseMap.get(activeModule.stepNum);
    const mod = activeModule.module;
    const progressKey = course ? `${course.id}_${mod.id}` : '';
    const progress = progressMap.get(progressKey);
    const isCompleted = progress?.status === 'completed';

    return (
      <PageContainer>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setActiveModule(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium">
              Step {activeModule.stepNum} - {STEP_DATA[activeModule.stepNum - 1]?.title}
            </p>
            <h3 className="font-semibold text-slate-800 truncate">{mod.title}</h3>
          </div>
          {isCompleted && <Badge variant="success">Completed</Badge>}
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6">
            {mod.type === 'video' && (
              <VideoViewer
                module={mod}
                progress={progress}
                onSaveProgress={(seconds) => {
                  if (course) {
                    const isFinished = seconds >= mod.duration * 60 * 0.9;
                    handleSaveModuleProgress(course.id, mod.id, {
                      status: isFinished ? 'completed' : 'in_progress',
                      videoProgress: seconds,
                      ...(isFinished ? { completedAt: Timestamp.now() } : {}),
                    });
                  }
                }}
              />
            )}
            {mod.type === 'reading' && (
              <>
                <ReadingViewer module={mod} />
                {!isCompleted && course && (
                  <Button
                    className="w-full mt-4"
                    onClick={() => handleCompleteModule(course.id, mod.id)}
                  >
                    Mark as Read
                  </Button>
                )}
              </>
            )}
            {mod.type === 'assessment' && (
              <AssessmentViewer
                module={mod}
                onSubmitScore={(score) => {
                  if (course) {
                    handleSaveModuleProgress(course.id, mod.id, {
                      status: 'completed',
                      assessmentScore: score,
                      completedAt: Timestamp.now(),
                    });
                  }
                }}
              />
            )}
            {(mod.type === 'reflection' || mod.type === 'discussion') && (
              <ReflectionViewer
                module={mod}
                existingText={progress?.reflectionText}
                onSave={(text) => {
                  if (course) {
                    handleSaveModuleProgress(course.id, mod.id, {
                      status: 'completed',
                      reflectionText: text,
                      completedAt: Timestamp.now(),
                    });
                  }
                }}
              />
            )}
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (isLoading) return <LoadingSkeleton />;

  return (
    <PageContainer title="12 Steps" subtitle="Complete each step to unlock the next">
      <div className="space-y-3">
        {STEP_DATA.map((step) => {
          const status = getStepStatus(step.number);
          const isExpanded = expandedStep === step.number;
          const course = courseMap.get(step.number);
          const pct = stepProgress.get(step.number) ?? 0;

          return (
            <div key={step.number}>
              <Card
                className={`transition-all ${
                  status === 'locked' ? 'opacity-50' : 'cursor-pointer hover:shadow-md'
                } ${isExpanded ? 'border-blue-300 shadow-md' : ''}`}
              >
                <CardContent className="p-4">
                  <button
                    className="w-full text-left"
                    disabled={status === 'locked'}
                    onClick={() => setExpandedStep(isExpanded ? null : step.number)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Step Number Circle */}
                      <div
                        className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                          status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : status === 'available'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {status === 'completed' ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : status === 'locked' ? (
                          <Lock className="h-5 w-5" />
                        ) : (
                          step.number
                        )}
                      </div>

                      {/* Step Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">
                            Step {step.number}: {step.title}
                          </h3>
                          {status === 'completed' && <Badge variant="success">Done</Badge>}
                          {step.number === currentStep && status === 'available' && (
                            <Badge>Current</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{step.principle}</p>
                        {status !== 'locked' && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5">{pct}% complete</span>
                          </div>
                        )}
                      </div>

                      {/* Expand Arrow */}
                      {status !== 'locked' && (
                        <div className="shrink-0 text-slate-400">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Expanded Module List */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
                      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        {step.description}
                      </p>
                      {course && course.modules && course.modules.length > 0 ? (
                        course.modules
                          .sort((a, b) => a.order - b.order)
                          .map((mod) => {
                            const Icon = MODULE_TYPE_ICONS[mod.type] ?? Circle;
                            const colorClass = MODULE_TYPE_COLORS[mod.type] ?? 'bg-slate-100 text-slate-600';
                            const prog = progressMap.get(`${course.id}_${mod.id}`);
                            const modCompleted = prog?.status === 'completed';

                            return (
                              <button
                                key={mod.id}
                                onClick={() => setActiveModule({ stepNum: step.number, module: mod })}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
                              >
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${modCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                    {mod.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="capitalize">{mod.type}</span>
                                    <span className="inline-block h-1 w-1 rounded-full bg-slate-300" />
                                    <Clock className="h-3 w-3" />
                                    <span>{mod.duration} min</span>
                                  </div>
                                </div>
                                {modCompleted ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                                ) : (
                                  <Circle className="h-5 w-5 text-slate-300 shrink-0" />
                                )}
                              </button>
                            );
                          })
                      ) : (
                        <div className="text-center py-6 text-slate-400">
                          <BookOpen className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Course content coming soon</p>
                          <p className="text-xs mt-1">
                            Joe McDonald's teaching for this step is being prepared.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
