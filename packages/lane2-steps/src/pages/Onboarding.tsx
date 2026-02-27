import { useState } from 'react';
import {
  PageContainer,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
} from '@reprieve/shared';
import { setDocument, serverTimestamp } from '@reprieve/shared/services/firebase/firestore';
import { useAuth } from '@reprieve/shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  preferredLanguage: 'en' | 'es';
  recoveryProgram: string;
  sponsorName: string;
  currentStep: number;
  sobrietyDate: string;
  recoveryGoals: string[];
}

const INITIAL_FORM: FormData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  preferredLanguage: 'en',
  recoveryProgram: '',
  sponsorName: '',
  currentStep: 1,
  sobrietyDate: '',
  recoveryGoals: [],
};

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'prefer_not', label: 'Prefer not to say' },
];

const PROGRAM_OPTIONS = [
  { value: 'aa', label: 'Alcoholics Anonymous (AA)' },
  { value: 'na', label: 'Narcotics Anonymous (NA)' },
  { value: 'cr', label: 'Celebrate Recovery' },
  { value: 'smart', label: 'SMART Recovery' },
  { value: 'church', label: 'Church-Based Program' },
  { value: 'other', label: 'Other Program' },
  { value: 'none', label: 'No Formal Program' },
];

const GOAL_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'sobriety', label: 'Maintain Sobriety', icon: '🌿' },
  { value: 'spiritual', label: 'Spiritual Growth', icon: '🙏' },
  { value: 'relationships', label: 'Heal Relationships', icon: '🤝' },
  { value: 'accountability', label: 'Accountability', icon: '🎯' },
  { value: 'service', label: 'Serve Others', icon: '💛' },
  { value: 'mental_health', label: 'Mental Wellness', icon: '🧠' },
  { value: 'community', label: 'Find Community', icon: '👥' },
  { value: 'self_awareness', label: 'Self-Awareness', icon: '🪞' },
];

const TOTAL_STEPS = 4;
const DRAFT_KEY = 'reprieve_lane2_onboarding_draft';

/* -------------------------------------------------------------------------- */
/*  Step Indicator                                                            */
/* -------------------------------------------------------------------------- */

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        const isActive = isCompleted || isCurrent;

        return (
          <div key={step} className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold transition-colors duration-200
                ${isCompleted
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : isCurrent
                    ? 'bg-amber-100 border-amber-600 text-amber-700'
                    : 'bg-stone-100 border-stone-300 text-stone-400'
                }
              `}
            >
              {isCompleted ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </div>
            {step < TOTAL_STEPS && (
              <div
                className={`
                  w-10 h-0.5 mx-1 transition-colors duration-200
                  ${isActive && step < currentStep ? 'bg-amber-600' : 'bg-stone-300'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 1 — Personal Info                                                    */
/* -------------------------------------------------------------------------- */

function StepPersonalInfo({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  return (
    <>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl text-stone-800">Personal Information</CardTitle>
        <CardDescription className="text-stone-500">
          Let's start with the basics so we can personalize your experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">First Name *</label>
            <Input
              placeholder="First name"
              value={data.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Last Name *</label>
            <Input
              placeholder="Last name"
              value={data.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Date of Birth *</label>
          <Input
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Gender</label>
          <select
            value={data.gender}
            onChange={(e) => onChange({ gender: e.target.value })}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Preferred Language</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onChange({ preferredLanguage: 'en' })}
              className={`flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
                data.preferredLanguage === 'en'
                  ? 'border-amber-600 bg-amber-50 text-amber-700'
                  : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => onChange({ preferredLanguage: 'es' })}
              className={`flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
                data.preferredLanguage === 'es'
                  ? 'border-amber-600 bg-amber-50 text-amber-700'
                  : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              Espa&ntilde;ol
            </button>
          </div>
        </div>
      </CardContent>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 2 — Recovery Background                                              */
/* -------------------------------------------------------------------------- */

function StepRecoveryBackground({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  return (
    <>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl text-stone-800">Recovery Background</CardTitle>
        <CardDescription className="text-stone-500">
          Tell us about your recovery journey so we can support you better.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Recovery Program *</label>
          <select
            value={data.recoveryProgram}
            onChange={(e) => onChange({ recoveryProgram: e.target.value })}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Select your program</option>
            {PROGRAM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Sponsor / Mentor Name</label>
          <Input
            placeholder="Optional"
            value={data.sponsorName}
            onChange={(e) => onChange({ sponsorName: e.target.value })}
            className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
          />
          <p className="text-xs text-stone-400 mt-1">If you have a sponsor or mentor, we can connect you.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Sobriety Date</label>
          <Input
            type="date"
            value={data.sobrietyDate}
            onChange={(e) => onChange({ sobrietyDate: e.target.value })}
            className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
          />
          <p className="text-xs text-stone-400 mt-1">Optional. We'll celebrate your milestones with you.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Current Step *</label>
          <p className="text-xs text-stone-400 mb-2">Which step are you currently working on?</p>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onChange({ currentStep: num })}
                className={`h-11 rounded-lg border text-sm font-semibold transition-colors ${
                  data.currentStep === num
                    ? 'border-amber-600 bg-amber-600 text-white shadow-sm'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 3 — Recovery Goals                                                   */
/* -------------------------------------------------------------------------- */

function StepRecoveryGoals({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const toggleGoal = (value: string) => {
    const current = data.recoveryGoals;
    const next = current.includes(value)
      ? current.filter((g) => g !== value)
      : [...current, value];
    onChange({ recoveryGoals: next });
  };

  return (
    <>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl text-stone-800">Recovery Goals</CardTitle>
        <CardDescription className="text-stone-500">
          What do you hope to achieve? Select all that resonate with you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = data.recoveryGoals.includes(goal.value);
            return (
              <button
                key={goal.value}
                type="button"
                onClick={() => toggleGoal(goal.value)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left text-sm font-medium transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span className="text-xl">{goal.icon}</span>
                <span className="flex-1">{goal.label}</span>
                {isSelected && <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </CardContent>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 4 — Review & Submit                                                  */
/* -------------------------------------------------------------------------- */

function StepReview({
  data,
  saving,
}: {
  data: FormData;
  saving: boolean;
}) {
  const programLabel = PROGRAM_OPTIONS.find((p) => p.value === data.recoveryProgram)?.label ?? data.recoveryProgram;

  return (
    <>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl text-stone-800">You're Ready</CardTitle>
        <CardDescription className="text-stone-500">
          Review your information and begin your step experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center text-4xl mb-2">🙏</div>
          <p className="text-center text-sm text-stone-600 leading-relaxed">
            Every journey begins with a single step. Yours starts now.
          </p>

          <div className="bg-stone-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-stone-500">Name</span>
              <span className="text-sm font-medium text-stone-800">{data.firstName} {data.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-stone-500">Program</span>
              <span className="text-sm font-medium text-stone-800">{programLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-stone-500">Starting Step</span>
              <span className="text-sm font-medium text-stone-800">Step {data.currentStep}</span>
            </div>
            {data.sponsorName && (
              <div className="flex justify-between">
                <span className="text-xs text-stone-500">Sponsor</span>
                <span className="text-sm font-medium text-stone-800">{data.sponsorName}</span>
              </div>
            )}
            {data.sobrietyDate && (
              <div className="flex justify-between">
                <span className="text-xs text-stone-500">Sobriety Date</span>
                <span className="text-sm font-medium text-stone-800">{data.sobrietyDate}</span>
              </div>
            )}
          </div>

          {data.recoveryGoals.length > 0 && (
            <div>
              <p className="text-xs text-stone-500 mb-2 text-center">Your Goals</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {data.recoveryGoals.map((g) => {
                  const goal = GOAL_OPTIONS.find((o) => o.value === g);
                  return (
                    <Badge key={g} className="bg-amber-50 text-amber-700 border-amber-200">
                      {goal?.icon} {goal?.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {saving && (
            <div className="text-center text-xs text-stone-400">Setting up your account...</div>
          )}
        </div>
      </CardContent>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Onboarding Component                                                 */
/* -------------------------------------------------------------------------- */

export default function Onboarding() {
  const navigate = useNavigate();
  const { firebaseUser, refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) return { ...INITIAL_FORM, ...JSON.parse(draft) };
    } catch {
      // Ignore
    }
    return INITIAL_FORM;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  const updateForm = (patch: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName.trim() && formData.lastName.trim() && formData.dateOfBirth);
      case 2:
        return !!formData.recoveryProgram;
      case 3:
        return formData.recoveryGoals.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch {
      // Storage might be full
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = async () => {
    if (!firebaseUser) return;

    setSaving(true);
    setError(null);

    try {
      await setDocument('users', firebaseUser.uid, {
        displayName: `${formData.firstName} ${formData.lastName}`,
        lanes: ['lane2'],
        onboardingComplete: true,
        stepExperience: {
          currentStep: formData.currentStep,
          recoveryProgram: formData.recoveryProgram,
          sponsorName: formData.sponsorName || null,
          sobrietyDate: formData.sobrietyDate || null,
          recoveryGoals: formData.recoveryGoals,
          enrollmentDate: serverTimestamp(),
        },
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender || null,
          preferredLanguage: formData.preferredLanguage,
          sobrietyDate: formData.sobrietyDate || null,
        },
      });

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Ignore
      }

      await refreshUser();
      navigate('/');
    } catch (err) {
      console.error('Onboarding save failed:', err);
      setError('Something went wrong saving your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const stepLabels = ['Personal Info', 'Recovery Background', 'Goals', 'Review & Submit'];

  return (
    <PageContainer>
      <div className="max-w-lg mx-auto py-6 px-4">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-stone-800">Welcome to Step Experience</h1>
          <p className="text-stone-500 text-sm mt-1">
            Step {step} of {TOTAL_STEPS} &mdash; {stepLabels[step - 1]}
          </p>
        </div>

        <StepIndicator currentStep={step} />

        <Card className="border-stone-200 shadow-sm">
          {step === 1 && <StepPersonalInfo data={formData} onChange={updateForm} />}
          {step === 2 && <StepRecoveryBackground data={formData} onChange={updateForm} />}
          {step === 3 && <StepRecoveryGoals data={formData} onChange={updateForm} />}
          {step === 4 && <StepReview data={formData} saving={saving} />}
        </Card>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mt-6 gap-3">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={saving}
              className="border-stone-300 text-stone-600 hover:bg-stone-50"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40"
            >
              Next
              <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60 min-w-[160px]"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Begin My Journey'
              )}
            </Button>
          )}
        </div>

        {step > 1 && (
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="text-xs text-stone-400 hover:text-amber-600 underline transition-colors"
            >
              {draftSaved ? 'Draft saved!' : 'Save draft and continue later'}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-stone-400 mt-6">
          Your information is private and secure. One day at a time.
        </p>
      </div>
    </PageContainer>
  );
}
