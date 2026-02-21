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
import { uploadFile } from '@reprieve/shared/services/firebase/storage';
import { useAuth } from '@reprieve/shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { GoalCategory } from '@reprieve/shared';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface NeedsAssessment {
  housing: boolean;
  employment: boolean;
  health: boolean;
  mentalHealth: boolean;
  substanceAbuse: boolean;
  legal: boolean;
  education: boolean;
  financial: boolean;
  transportation: boolean;
  childcare: boolean;
}

interface UploadedDoc {
  name: string;
  type: string;
  file: File;
}

interface FormData {
  // Step 1 — Personal Info
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  preferredLanguage: 'en' | 'es';

  // Step 2 — Your Journey
  referralSource: string;
  facilityName: string;
  releaseDate: string;
  paroleOfficerName: string;

  // Step 3 — Needs Assessment
  needs: NeedsAssessment;

  // Step 4 — Initial Goals
  selectedGoals: GoalCategory[];

  // Step 5 — Document Uploads
  uploadedDocs: UploadedDoc[];

  // Step 6 — Sobriety Date + Review
  sobrietyDate: string;
}

const INITIAL_NEEDS: NeedsAssessment = {
  housing: false,
  employment: false,
  health: false,
  mentalHealth: false,
  substanceAbuse: false,
  legal: false,
  education: false,
  financial: false,
  transportation: false,
  childcare: false,
};

const INITIAL_FORM: FormData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  preferredLanguage: 'en',
  referralSource: '',
  facilityName: '',
  releaseDate: '',
  paroleOfficerName: '',
  needs: { ...INITIAL_NEEDS },
  selectedGoals: [],
  uploadedDocs: [],
  sobrietyDate: '',
};

const NEEDS_OPTIONS: { key: keyof NeedsAssessment; label: string; icon: string }[] = [
  { key: 'housing', label: 'Housing', icon: '🏠' },
  { key: 'employment', label: 'Employment', icon: '💼' },
  { key: 'health', label: 'Physical Health', icon: '🏥' },
  { key: 'mentalHealth', label: 'Mental Health', icon: '🧠' },
  { key: 'substanceAbuse', label: 'Substance Recovery', icon: '🌿' },
  { key: 'legal', label: 'Legal Assistance', icon: '⚖' },
  { key: 'education', label: 'Education/Training', icon: '📚' },
  { key: 'financial', label: 'Financial Literacy', icon: '💰' },
  { key: 'transportation', label: 'Transportation', icon: '🚌' },
  { key: 'childcare', label: 'Childcare', icon: '👶' },
];

const DRAFT_KEY = 'reprieve_onboarding_draft';

const GOAL_OPTIONS: { value: GoalCategory; label: string; icon: string }[] = [
  { value: 'sobriety', label: 'Sobriety', icon: '🌿' },
  { value: 'employment', label: 'Employment', icon: '💼' },
  { value: 'housing', label: 'Housing', icon: '🏠' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'health', label: 'Health', icon: '❤️' },
  { value: 'financial', label: 'Financial', icon: '💰' },
  { value: 'legal', label: 'Legal', icon: '⚖️' },
  { value: 'personal', label: 'Personal', icon: '🌟' },
];

const REFERRAL_OPTIONS = [
  { value: 'court', label: 'Court Referral' },
  { value: 'prison', label: 'Prison / Correctional Facility' },
  { value: 'self', label: 'Self-Referred' },
  { value: 'other_program', label: 'Another Program' },
  { value: 'walk_in', label: 'Walk-In' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'prefer_not', label: 'Prefer not to say' },
];

const TOTAL_STEPS = 6;

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
            {/* Circle */}
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

            {/* Connecting line */}
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
          Let's start with the basics. This helps us personalize your experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* First / Last name */}
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

        {/* Date of birth */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Date of Birth *</label>
          <Input
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Gender</label>
          <select
            value={data.gender}
            onChange={(e) => onChange({ gender: e.target.value })}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Preferred language */}
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
/*  Step 2 — Your Journey                                                     */
/* -------------------------------------------------------------------------- */

function StepYourJourney({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  return (
    <>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl text-stone-800">Your Journey</CardTitle>
        <CardDescription className="text-stone-500">
          Understanding where you're coming from helps us connect you with the right resources.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral source */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">How did you get here? *</label>
          <div className="space-y-2">
            {REFERRAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ referralSource: opt.value })}
                className={`w-full text-left rounded-md border px-4 py-3 text-sm font-medium transition-colors ${
                  data.referralSource === opt.value
                    ? 'border-amber-600 bg-amber-50 text-amber-700'
                    : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Facility name (conditional) */}
        {(data.referralSource === 'court' ||
          data.referralSource === 'prison' ||
          data.referralSource === 'other_program') && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Facility / Program Name</label>
            <Input
              placeholder="Name of facility or program"
              value={data.facilityName}
              onChange={(e) => onChange({ facilityName: e.target.value })}
              className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>
        )}

        {/* Release date */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Release Date</label>
          <Input
            type="date"
            value={data.releaseDate}
            onChange={(e) => onChange({ releaseDate: e.target.value })}
            className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        {/* Parole officer */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Parole / Probation Officer <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <Input
            placeholder="Officer name"
            value={data.paroleOfficerName}
            onChange={(e) => onChange({ paroleOfficerName: e.target.value })}
            className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>
      </CardContent>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 3 — Needs Assessment                                                 */
/* -------------------------------------------------------------------------- */

function StepNeedsAssessment({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const toggleNeed = (key: keyof NeedsAssessment) => {
    onChange({
      needs: { ...data.needs, [key]: !data.needs[key] },
    });
  };

  const selectedCount = Object.values(data.needs).filter(Boolean).length;

  return (
    <>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl text-stone-800">Needs Assessment</CardTitle>
        <CardDescription className="text-stone-500">
          Help us understand what support you need most. Select all that apply.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2.5">
          {NEEDS_OPTIONS.map((need) => {
            const selected = data.needs[need.key];
            return (
              <button
                key={need.key}
                type="button"
                onClick={() => toggleNeed(need.key)}
                className={`flex items-center gap-2.5 rounded-lg border-2 px-3 py-3 text-left transition-all duration-200 ${
                  selected
                    ? 'border-amber-600 bg-amber-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <span className="text-lg">{need.icon}</span>
                <span
                  className={`text-sm font-medium ${
                    selected ? 'text-amber-700' : 'text-stone-600'
                  }`}
                >
                  {need.label}
                </span>
                {selected && (
                  <CheckCircle2 className="h-4 w-4 text-amber-600 ml-auto flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-stone-400 mt-4">
          {selectedCount === 0
            ? 'Select at least one area where you need support'
            : `${selectedCount} area${selectedCount !== 1 ? 's' : ''} selected`}
        </p>
      </CardContent>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 4 — Initial Goals                                                    */
/* -------------------------------------------------------------------------- */

function StepGoals({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const toggleGoal = (goal: GoalCategory) => {
    const current = data.selectedGoals;
    const next = current.includes(goal)
      ? current.filter((g) => g !== goal)
      : [...current, goal];
    onChange({ selectedGoals: next });
  };

  return (
    <>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl text-stone-800">What Are Your Goals?</CardTitle>
        <CardDescription className="text-stone-500">
          Select the areas you'd like to focus on. You can always change these later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {GOAL_OPTIONS.map((goal) => {
            const selected = data.selectedGoals.includes(goal.value);
            return (
              <button
                key={goal.value}
                type="button"
                onClick={() => toggleGoal(goal.value)}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 px-3 py-5 text-center transition-all duration-200 ${
                  selected
                    ? 'border-amber-600 bg-amber-50 shadow-sm'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {/* Selection indicator */}
                {selected && (
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-white">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <span className="text-2xl mb-2">{goal.icon}</span>
                <span
                  className={`text-sm font-medium ${
                    selected ? 'text-amber-700' : 'text-stone-600'
                  }`}
                >
                  {goal.label}
                </span>
              </button>
            );
          })}
        </div>

        {data.selectedGoals.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {data.selectedGoals.map((g) => (
              <Badge
                key={g}
                className="bg-amber-100 text-amber-700 border-amber-200 capitalize"
              >
                {g}
              </Badge>
            ))}
          </div>
        )}

        {data.selectedGoals.length === 0 && (
          <p className="mt-4 text-center text-sm text-stone-400">
            Pick at least one area to get started
          </p>
        )}
      </CardContent>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 5 — Document Uploads                                                 */
/* -------------------------------------------------------------------------- */

function StepDocumentUploads({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc: UploadedDoc = {
      name: file.name,
      type: file.type,
      file,
    };

    onChange({ uploadedDocs: [...data.uploadedDocs, newDoc] });
    // Reset the input for repeat uploads
    e.target.value = '';
  };

  const removeDoc = (index: number) => {
    onChange({
      uploadedDocs: data.uploadedDocs.filter((_, i) => i !== index),
    });
  };

  return (
    <>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl text-stone-800">Upload Documents</CardTitle>
        <CardDescription className="text-stone-500">
          Upload your ID, court papers, or any documents you have. You can always add more later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload button */}
        <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/30 cursor-pointer py-8 transition-colors">
          <Upload className="h-8 w-8 text-stone-400 mb-2" />
          <span className="text-sm font-medium text-stone-600">
            Tap to upload a document
          </span>
          <span className="text-xs text-stone-400 mt-1">
            PDF, JPG, PNG, DOC accepted
          </span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileChange}
          />
        </label>

        {/* Uploaded files list */}
        {data.uploadedDocs.length > 0 && (
          <div className="space-y-2">
            {data.uploadedDocs.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg bg-white border border-stone-200"
              >
                <FileText className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-stone-400">
                    {(doc.file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeDoc(idx)}
                  className="text-stone-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-stone-400">
          This step is optional. You can skip and upload documents anytime from your Document Vault.
        </p>
      </CardContent>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 6 — Sobriety Date + Review                                           */
/* -------------------------------------------------------------------------- */

function StepSobriety({
  data,
  onChange,
  saving,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  saving: boolean;
}) {
  return (
    <>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl text-stone-800">Your Sobriety Journey</CardTitle>
        <CardDescription className="text-stone-500">
          If you'd like to track your sobriety, enter your date below. This is completely optional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Encouraging message */}
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5 text-center">
          <div className="text-3xl mb-3">🌅</div>
          <p className="text-stone-700 font-medium leading-relaxed">
            Every sunrise is a new beginning. No matter where you've been,
            <span className="text-amber-700 font-semibold"> today is the first day of the rest of your life.</span>
          </p>
          <p className="text-stone-500 text-sm mt-2">
            We're honored to walk this path with you.
          </p>
        </div>

        {/* Sobriety date */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Sobriety Date <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <Input
            type="date"
            value={data.sobrietyDate}
            onChange={(e) => onChange({ sobrietyDate: e.target.value })}
            className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
          />
          <p className="text-xs text-stone-400 mt-1">
            The date you started or plan to start your sobriety journey
          </p>
        </div>

        {/* Summary badges */}
        <div className="rounded-lg bg-stone-50 border border-stone-200 p-4">
          <p className="text-sm font-medium text-stone-600 mb-3 text-center">Your Profile Summary</p>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 justify-center text-xs">
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                {data.firstName} {data.lastName}
              </Badge>
              {data.referralSource && (
                <Badge className="bg-stone-100 text-stone-600 border-stone-200 capitalize">
                  {data.referralSource.replace('_', ' ')}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center text-xs">
              {data.selectedGoals.map((g) => (
                <Badge key={g} className="bg-amber-50 text-amber-600 border-amber-200 capitalize">
                  {g}
                </Badge>
              ))}
            </div>
            {Object.values(data.needs).some(Boolean) && (
              <div className="flex flex-wrap gap-1.5 justify-center text-xs">
                {Object.entries(data.needs)
                  .filter(([, v]) => v)
                  .map(([k]) => (
                    <Badge key={k} className="bg-blue-50 text-blue-600 border-blue-200 capitalize">
                      {k.replace(/([A-Z])/g, ' $1').trim()}
                    </Badge>
                  ))}
              </div>
            )}
            {data.uploadedDocs.length > 0 && (
              <p className="text-center text-xs text-stone-500">
                {data.uploadedDocs.length} document{data.uploadedDocs.length !== 1 ? 's' : ''} ready to upload
              </p>
            )}
          </div>
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
    // Restore draft if available
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        // Cannot serialize File objects, so reset uploadedDocs
        return { ...INITIAL_FORM, ...parsed, uploadedDocs: [] };
      }
    } catch {
      // Ignore parse errors
    }
    return INITIAL_FORM;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  /* ---- helpers ---- */

  const updateForm = (patch: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName.trim() && formData.lastName.trim() && formData.dateOfBirth);
      case 2:
        return !!formData.referralSource;
      case 3:
        return Object.values(formData.needs).some(Boolean);
      case 4:
        return formData.selectedGoals.length > 0;
      case 5:
        return true; // document upload is optional
      case 6:
        return true; // sobriety date is optional
      default:
        return false;
    }
  };

  // Save draft to localStorage
  const handleSaveDraft = () => {
    try {
      // Cannot serialize File objects, so exclude uploadedDocs
      const draftData = { ...formData, uploadedDocs: [] };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch {
      // Storage might be full; silently fail
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
      // Upload any documents first
      for (const doc of formData.uploadedDocs) {
        try {
          const timestamp = Date.now();
          const storagePath = `documents/${firebaseUser.uid}/${timestamp}_${doc.name}`;
          await uploadFile(storagePath, doc.file);
        } catch (uploadErr) {
          console.error('Document upload failed:', uploadErr);
          // Continue with onboarding even if a document fails
        }
      }

      // Collect selected needs as an array
      const needsArray = Object.entries(formData.needs)
        .filter(([, v]) => v)
        .map(([k]) => k);

      await setDocument('users', firebaseUser.uid, {
        displayName: `${formData.firstName} ${formData.lastName}`,
        lanes: ['lane1'],
        onboardingComplete: true,
        reentry: {
          enrollmentStatus: 'active',
          referralSource: formData.referralSource,
          facilityName: formData.facilityName || null,
          releaseDate: formData.releaseDate || null,
          paroleOfficerName: formData.paroleOfficerName || null,
          sobrietyDate: formData.sobrietyDate || null,
          initialGoals: formData.selectedGoals,
          needsAssessment: needsArray,
          enrolledAt: serverTimestamp(),
        },
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender || null,
          preferredLanguage: formData.preferredLanguage,
        },
      });

      // Clear saved draft
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

  /* ---- step labels (for a11y / SEO) ---- */
  const stepLabels = ['Personal Info', 'Your Journey', 'Needs Assessment', 'Initial Goals', 'Documents', 'Review & Submit'];

  return (
    <PageContainer>
      <div className="max-w-lg mx-auto py-6 px-4">
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-stone-800">Welcome to Re-Entry</h1>
          <p className="text-stone-500 text-sm mt-1">
            Step {step} of {TOTAL_STEPS} &mdash; {stepLabels[step - 1]}
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={step} />

        {/* Card */}
        <Card className="border-stone-200 shadow-sm">
          {step === 1 && <StepPersonalInfo data={formData} onChange={updateForm} />}
          {step === 2 && <StepYourJourney data={formData} onChange={updateForm} />}
          {step === 3 && <StepNeedsAssessment data={formData} onChange={updateForm} />}
          {step === 4 && <StepGoals data={formData} onChange={updateForm} />}
          {step === 5 && <StepDocumentUploads data={formData} onChange={updateForm} />}
          {step === 6 && <StepSobriety data={formData} onChange={updateForm} saving={saving} />}
        </Card>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
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
            <div /> /* spacer */
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
                'Complete Setup'
              )}
            </Button>
          )}
        </div>

        {/* Save Draft */}
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

        {/* Footer encouragement */}
        <p className="text-center text-xs text-stone-400 mt-6">
          Your information is private and secure. We're here to help, not judge.
        </p>
      </div>
    </PageContainer>
  );
}
