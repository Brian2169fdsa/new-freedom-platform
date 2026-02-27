import { useState, useCallback, useRef } from 'react';
import {
  PageContainer,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Badge,
  Textarea,
  useAuth,
} from '@reprieve/shared';
import { addDocument, updateDocument } from '@reprieve/shared/services/firebase/firestore';
import { chatWithAI } from '@reprieve/shared/services/firebase/functions';
import { create } from 'zustand';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  X,
  Sparkles,
  Loader2,
  Download,
  Printer,
  ChevronLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
}

interface WorkEntry {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  isGapPeriod: boolean;
  gapLabel: string;
}

interface EducationEntry {
  id: string;
  institution: string;
  credential: string;
  year: string;
  type: 'ged' | 'vocational' | 'certification' | 'college' | 'program' | 'other';
}

interface ReferenceEntry {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  skills: string[];
  workExperience: WorkEntry[];
  education: EducationEntry[];
  references: ReferenceEntry[];
}

interface WizardState {
  currentStep: number;
  data: ResumeData;
  savedDocId: string | null;
  setStep: (step: number) => void;
  updatePersonalInfo: (field: keyof PersonalInfo, value: string) => void;
  setSummary: (summary: string) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  addWorkEntry: () => void;
  updateWorkEntry: (id: string, updates: Partial<WorkEntry>) => void;
  removeWorkEntry: (id: string) => void;
  addEducation: () => void;
  updateEducation: (id: string, updates: Partial<EducationEntry>) => void;
  removeEducation: (id: string) => void;
  addReference: () => void;
  updateReference: (id: string, updates: Partial<ReferenceEntry>) => void;
  removeReference: (id: string) => void;
  setSavedDocId: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  'Personal Info',
  'Summary',
  'Skills',
  'Experience',
  'Education',
  'References',
  'Preview',
] as const;

const SUGGESTED_SKILLS: Record<string, string[]> = {
  'Warehouse & Logistics': [
    'Forklift Operation',
    'Inventory Management',
    'Shipping & Receiving',
    'OSHA Safety',
    'Pallet Jack',
    'Quality Control',
  ],
  'Food Service': [
    'Food Safety (ServSafe)',
    'Kitchen Prep',
    'Customer Service',
    'Cash Handling',
    'Time Management',
    'Team Collaboration',
  ],
  Construction: [
    'Power Tools',
    'Blueprint Reading',
    'Concrete Work',
    'Framing',
    'Safety Compliance',
    'Physical Endurance',
  ],
  'General Skills': [
    'Reliability',
    'Problem Solving',
    'Communication',
    'Adaptability',
    'Work Ethic',
    'Conflict Resolution',
    'Leadership',
    'Attention to Detail',
  ],
};

const EDUCATION_TYPES: { value: EducationEntry['type']; label: string }[] = [
  { value: 'ged', label: 'GED / High School' },
  { value: 'vocational', label: 'Vocational Training' },
  { value: 'certification', label: 'Certification' },
  { value: 'college', label: 'College / University' },
  { value: 'program', label: 'Program Completed' },
  { value: 'other', label: 'Other' },
];

const GAP_LABELS = [
  'Personal Development Period',
  'Skill Development & Self-Improvement',
  'Career Transition Period',
  'Community Service & Growth',
  'Education & Training Focus',
];

// ---------------------------------------------------------------------------
// Zustand Store (inline)
// ---------------------------------------------------------------------------

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const INITIAL_DATA: ResumeData = {
  personalInfo: { firstName: '', lastName: '', email: '', phone: '', city: '', state: '' },
  summary: '',
  skills: [],
  workExperience: [],
  education: [],
  references: [],
};

const useWizard = create<WizardState>((set) => ({
  currentStep: 0,
  data: INITIAL_DATA,
  savedDocId: null,

  setStep: (step) => set({ currentStep: step }),

  updatePersonalInfo: (field, value) =>
    set((state) => ({
      data: {
        ...state.data,
        personalInfo: { ...state.data.personalInfo, [field]: value },
      },
    })),

  setSummary: (summary) =>
    set((state) => ({ data: { ...state.data, summary } })),

  addSkill: (skill) =>
    set((state) => {
      if (state.data.skills.includes(skill)) return state;
      return { data: { ...state.data, skills: [...state.data.skills, skill] } };
    }),

  removeSkill: (skill) =>
    set((state) => ({
      data: { ...state.data, skills: state.data.skills.filter((s) => s !== skill) },
    })),

  addWorkEntry: () =>
    set((state) => ({
      data: {
        ...state.data,
        workExperience: [
          ...state.data.workExperience,
          {
            id: generateId(),
            title: '',
            company: '',
            startDate: '',
            endDate: '',
            current: false,
            description: '',
            isGapPeriod: false,
            gapLabel: GAP_LABELS[0],
          },
        ],
      },
    })),

  updateWorkEntry: (id, updates) =>
    set((state) => ({
      data: {
        ...state.data,
        workExperience: state.data.workExperience.map((entry) =>
          entry.id === id ? { ...entry, ...updates } : entry
        ),
      },
    })),

  removeWorkEntry: (id) =>
    set((state) => ({
      data: {
        ...state.data,
        workExperience: state.data.workExperience.filter((entry) => entry.id !== id),
      },
    })),

  addEducation: () =>
    set((state) => ({
      data: {
        ...state.data,
        education: [
          ...state.data.education,
          { id: generateId(), institution: '', credential: '', year: '', type: 'ged' },
        ],
      },
    })),

  updateEducation: (id, updates) =>
    set((state) => ({
      data: {
        ...state.data,
        education: state.data.education.map((entry) =>
          entry.id === id ? { ...entry, ...updates } : entry
        ),
      },
    })),

  removeEducation: (id) =>
    set((state) => ({
      data: { ...state.data, education: state.data.education.filter((e) => e.id !== id) },
    })),

  addReference: () =>
    set((state) => ({
      data: {
        ...state.data,
        references: [
          ...state.data.references,
          { id: generateId(), name: '', relationship: '', phone: '', email: '' },
        ],
      },
    })),

  updateReference: (id, updates) =>
    set((state) => ({
      data: {
        ...state.data,
        references: state.data.references.map((ref) =>
          ref.id === id ? { ...ref, ...updates } : ref
        ),
      },
    })),

  removeReference: (id) =>
    set((state) => ({
      data: { ...state.data, references: state.data.references.filter((r) => r.id !== id) },
    })),

  setSavedDocId: (id) => set({ savedDocId: id }),
}));

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 w-full">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex-1 flex items-center">
          <div
            className={`h-2 w-full rounded-full transition-colors ${
              i < current
                ? 'bg-blue-600'
                : i === current
                  ? 'bg-blue-400'
                  : 'bg-slate-200'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Personal Info
// ---------------------------------------------------------------------------

function StepPersonalInfo() {
  const { personalInfo, updatePersonalInfo } = useWizard((s) => ({
    personalInfo: s.data.personalInfo,
    updatePersonalInfo: s.updatePersonalInfo,
  }));

  const fields: { key: keyof PersonalInfo; label: string; type: string; placeholder: string }[] = [
    { key: 'firstName', label: 'First Name', type: 'text', placeholder: 'John' },
    { key: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Doe' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'john.doe@email.com' },
    { key: 'phone', label: 'Phone', type: 'tel', placeholder: '(602) 555-0123' },
    { key: 'city', label: 'City', type: 'text', placeholder: 'Phoenix' },
    { key: 'state', label: 'State', type: 'text', placeholder: 'AZ' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <p className="text-sm text-slate-500">
          Your contact details for the resume header. Only include what you are comfortable sharing.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key} className={key === 'email' ? 'sm:col-span-2' : ''}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <Input
                type={type}
                placeholder={placeholder}
                value={personalInfo[key]}
                onChange={(e) => updatePersonalInfo(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Professional Summary
// ---------------------------------------------------------------------------

function StepSummary() {
  const { summary, setSummary, skills, personalInfo } = useWizard((s) => ({
    summary: s.data.summary,
    setSummary: s.setSummary,
    skills: s.data.skills,
    personalInfo: s.data.personalInfo,
  }));
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleGenerateSummary = async () => {
    setGenerating(true);
    setAiError('');
    try {
      const skillsList = skills.length > 0 ? skills.join(', ') : 'general labor skills';
      const prompt =
        `Write a professional resume summary (3-4 sentences) for someone named ${personalInfo.firstName || 'a candidate'} ` +
        `who is re-entering the workforce. They have skills in: ${skillsList}. ` +
        `Focus on strengths, growth mindset, and readiness to contribute. ` +
        `Do NOT mention incarceration, criminal history, or anything negative. ` +
        `Keep it positive, professional, and forward-looking. Return only the summary text.`;

      const result = await chatWithAI({ message: prompt });
      setSummary(result.data.reply);
    } catch (error) {
      console.error('AI summary generation failed:', error);
      setAiError('Could not generate summary right now. Please write one manually or try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Summary</CardTitle>
        <p className="text-sm text-slate-500">
          A brief overview of your strengths and goals. Let AI help you write a compelling summary.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            rows={5}
            placeholder="Dedicated and motivated professional seeking an opportunity to contribute my skills and strong work ethic to a growing team..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSummary}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {generating ? 'Writing...' : 'Generate with AI'}
            </Button>
            <span className="text-xs text-slate-400">
              AI will craft a strength-based summary for you
            </span>
          </div>
          {aiError && <p className="text-sm text-red-600">{aiError}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Skills
// ---------------------------------------------------------------------------

function StepSkills() {
  const { skills, addSkill, removeSkill } = useWizard((s) => ({
    skills: s.data.skills,
    addSkill: s.addSkill,
    removeSkill: s.removeSkill,
  }));
  const [customSkill, setCustomSkill] = useState('');

  const handleAddCustom = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      addSkill(trimmed);
      setCustomSkill('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <p className="text-sm text-slate-500">
          Highlight your abilities. Skills-first resumes work great for fair-chance employers.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* Current skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} className="pl-3 pr-1 py-1.5 flex items-center gap-1.5">
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add custom */}
          <div className="flex gap-2">
            <Input
              placeholder="Type a skill and press Add"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
              className="flex-1"
            />
            <Button size="sm" onClick={handleAddCustom} disabled={!customSkill.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          {/* Suggested skill categories */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-600">Suggested Skills</p>
            {Object.entries(SUGGESTED_SKILLS).map(([category, categorySkills]) => (
              <div key={category}>
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                  {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill) => {
                    const isSelected = skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => (isSelected ? removeSkill(skill) : addSkill(skill))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          isSelected
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {isSelected ? <Check className="h-3 w-3 inline mr-1" /> : null}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Work Experience
// ---------------------------------------------------------------------------

function StepWorkExperience() {
  const { workExperience, addWorkEntry, updateWorkEntry, removeWorkEntry } = useWizard((s) => ({
    workExperience: s.data.workExperience,
    addWorkEntry: s.addWorkEntry,
    updateWorkEntry: s.updateWorkEntry,
    removeWorkEntry: s.removeWorkEntry,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Experience</CardTitle>
        <p className="text-sm text-slate-500">
          Optional. Add jobs or mark time gaps with a positive framing. Fair-chance employers value
          honesty and growth.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workExperience.map((entry) => (
            <div key={entry.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={entry.isGapPeriod}
                    onChange={(e) =>
                      updateWorkEntry(entry.id, { isGapPeriod: e.target.checked })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-600">This is a gap period</span>
                </label>
                <button
                  onClick={() => removeWorkEntry(entry.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  aria-label="Remove entry"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {entry.isGapPeriod ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      How to describe this period
                    </label>
                    <select
                      value={entry.gapLabel}
                      onChange={(e) => updateWorkEntry(entry.id, { gapLabel: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {GAP_LABELS.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Activities during this period (optional)
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="Completed vocational training, earned certifications, volunteered..."
                      value={entry.description}
                      onChange={(e) => updateWorkEntry(entry.id, { description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
                      <Input
                        type="month"
                        value={entry.startDate}
                        onChange={(e) => updateWorkEntry(entry.id, { startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                      <Input
                        type="month"
                        value={entry.endDate}
                        onChange={(e) => updateWorkEntry(entry.id, { endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Job Title
                      </label>
                      <Input
                        placeholder="Warehouse Associate"
                        value={entry.title}
                        onChange={(e) => updateWorkEntry(entry.id, { title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Company
                      </label>
                      <Input
                        placeholder="Company Name"
                        value={entry.company}
                        onChange={(e) => updateWorkEntry(entry.id, { company: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Start Date
                      </label>
                      <Input
                        type="month"
                        value={entry.startDate}
                        onChange={(e) => updateWorkEntry(entry.id, { startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        End Date
                      </label>
                      <div className="space-y-1">
                        <Input
                          type="month"
                          value={entry.endDate}
                          disabled={entry.current}
                          onChange={(e) => updateWorkEntry(entry.id, { endDate: e.target.value })}
                        />
                        <label className="flex items-center gap-1.5 text-xs text-slate-500">
                          <input
                            type="checkbox"
                            checked={entry.current}
                            onChange={(e) =>
                              updateWorkEntry(entry.id, {
                                current: e.target.checked,
                                endDate: e.target.checked ? '' : entry.endDate,
                              })
                            }
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          Currently working here
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Description
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="Key responsibilities and achievements..."
                      value={entry.description}
                      onChange={(e) => updateWorkEntry(entry.id, { description: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          <Button variant="outline" onClick={addWorkEntry} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Experience or Gap Period
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Education & Certifications
// ---------------------------------------------------------------------------

function StepEducation() {
  const { education, addEducation, updateEducation, removeEducation } = useWizard((s) => ({
    education: s.data.education,
    addEducation: s.addEducation,
    updateEducation: s.updateEducation,
    removeEducation: s.removeEducation,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Education & Certifications</CardTitle>
        <p className="text-sm text-slate-500">
          Include GEDs, vocational training, certifications, and any programs you have completed.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {education.map((entry) => (
            <div key={entry.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Type</label>
                <button
                  onClick={() => removeEducation(entry.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  aria-label="Remove entry"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <select
                value={entry.type}
                onChange={(e) =>
                  updateEducation(entry.id, { type: e.target.value as EducationEntry['type'] })
                }
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {EDUCATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Institution / Program
                  </label>
                  <Input
                    placeholder="Community College, Training Center..."
                    value={entry.institution}
                    onChange={(e) => updateEducation(entry.id, { institution: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Credential / Certificate
                  </label>
                  <Input
                    placeholder="GED, OSHA 10, Forklift Cert..."
                    value={entry.credential}
                    onChange={(e) => updateEducation(entry.id, { credential: e.target.value })}
                  />
                </div>
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Year Completed
                </label>
                <Input
                  type="text"
                  placeholder="2024"
                  maxLength={4}
                  value={entry.year}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    updateEducation(entry.id, { year: val });
                  }}
                />
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addEducation} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Education or Certification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 6: References
// ---------------------------------------------------------------------------

function StepReferences() {
  const { references, addReference, updateReference, removeReference } = useWizard((s) => ({
    references: s.data.references,
    addReference: s.addReference,
    updateReference: s.updateReference,
    removeReference: s.removeReference,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>References</CardTitle>
        <p className="text-sm text-slate-500">
          Optional. Case managers, mentors, program directors, or former supervisors make strong
          references.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {references.map((ref) => (
            <div key={ref.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-end">
                <button
                  onClick={() => removeReference(ref.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  aria-label="Remove reference"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <Input
                    placeholder="Jane Smith"
                    value={ref.name}
                    onChange={(e) => updateReference(ref.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Relationship
                  </label>
                  <Input
                    placeholder="Case Manager, Mentor, Supervisor..."
                    value={ref.relationship}
                    onChange={(e) => updateReference(ref.id, { relationship: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <Input
                    type="tel"
                    placeholder="(602) 555-0123"
                    value={ref.phone}
                    onChange={(e) => updateReference(ref.id, { phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="jane@example.com"
                    value={ref.email}
                    onChange={(e) => updateReference(ref.id, { email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addReference} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Reference
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 7: Preview & Download
// ---------------------------------------------------------------------------

function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthIdx = parseInt(month, 10) - 1;
  return `${monthNames[monthIdx] ?? month} ${year}`;
}

function StepPreview() {
  const data = useWizard((s) => s.data);
  const previewRef = useRef<HTMLDivElement>(null);
  const { personalInfo, summary, skills, workExperience, education, references } = data;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const fullName = [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(' ');
  const location = [personalInfo.city, personalInfo.state].filter(Boolean).join(', ');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Download className="h-4 w-4 mr-2" /> Save as PDF
        </Button>
        <span className="text-xs text-slate-400">Use your browser&apos;s print dialog to save as PDF</span>
      </div>

      {/* Print-friendly resume */}
      <div
        ref={previewRef}
        className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 print:border-none print:shadow-none print:p-0 print:rounded-none"
      >
        {/* Header */}
        <div className="text-center border-b-2 border-slate-300 pb-4 mb-5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
            {fullName || 'Your Name'}
          </h1>
          <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-600">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {location && <span>{location}</span>}
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
              Professional Summary
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
              Skills
            </h2>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {skills.map((skill, i) => (
                <span key={skill} className="text-sm text-slate-700">
                  {skill}
                  {i < skills.length - 1 ? ' \u2022' : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {workExperience.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
              Experience
            </h2>
            <div className="space-y-3">
              {workExperience.map((entry) => {
                const dateRange = [
                  formatMonthYear(entry.startDate),
                  entry.current ? 'Present' : formatMonthYear(entry.endDate),
                ]
                  .filter(Boolean)
                  .join(' - ');

                return (
                  <div key={entry.id}>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {entry.isGapPeriod
                          ? entry.gapLabel
                          : entry.title || 'Position'}
                      </h3>
                      {dateRange && (
                        <span className="text-xs text-slate-500 flex-shrink-0 ml-4">
                          {dateRange}
                        </span>
                      )}
                    </div>
                    {!entry.isGapPeriod && entry.company && (
                      <p className="text-sm text-slate-600">{entry.company}</p>
                    )}
                    {entry.description && (
                      <p className="text-sm text-slate-600 mt-1">{entry.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
              Education & Certifications
            </h2>
            <div className="space-y-2">
              {education.map((entry) => (
                <div key={entry.id} className="flex items-baseline justify-between">
                  <div>
                    <span className="text-sm font-semibold text-slate-800">
                      {entry.credential || 'Credential'}
                    </span>
                    {entry.institution && (
                      <span className="text-sm text-slate-600"> - {entry.institution}</span>
                    )}
                  </div>
                  {entry.year && (
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-4">
                      {entry.year}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* References */}
        {references.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
              References
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {references.map((ref) => (
                <div key={ref.id}>
                  <p className="text-sm font-semibold text-slate-800">{ref.name || 'Name'}</p>
                  {ref.relationship && (
                    <p className="text-xs text-slate-500">{ref.relationship}</p>
                  )}
                  {ref.phone && <p className="text-xs text-slate-600">{ref.phone}</p>}
                  {ref.email && <p className="text-xs text-slate-600">{ref.email}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ResumeBuilder() {
  const { firebaseUser } = useAuth();
  const currentStep = useWizard((s) => s.currentStep);
  const setStep = useWizard((s) => s.setStep);
  const data = useWizard((s) => s.data);
  const savedDocId = useWizard((s) => s.savedDocId);
  const setSavedDocId = useWizard((s) => s.setSavedDocId);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    if (!firebaseUser?.uid) return;

    setSaving(true);
    setSaveMessage('');
    try {
      const payload = {
        userId: firebaseUser.uid,
        ...data,
        lastModifiedStep: currentStep,
      };

      if (savedDocId) {
        await updateDocument('resumes', savedDocId, payload);
      } else {
        const docId = await addDocument('resumes', payload);
        setSavedDocId(docId);
      }
      setSaveMessage('Resume saved successfully.');
    } catch (error) {
      console.error('Failed to save resume:', error);
      setSaveMessage('Failed to save. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepPersonalInfo />;
      case 1:
        return <StepSummary />;
      case 2:
        return <StepSkills />;
      case 3:
        return <StepWorkExperience />;
      case 4:
        return <StepEducation />;
      case 5:
        return <StepReferences />;
      case 6:
        return <StepPreview />;
      default:
        return null;
    }
  };

  return (
    <PageContainer title="Resume Builder" subtitle="Create a professional, fair-chance resume">
      {/* Back link */}
      <Link
        to="/tools"
        className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800 -mt-2 mb-2 print:hidden"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Tools
      </Link>

      {/* Step indicator */}
      <div className="print:hidden">
        <StepIndicator current={currentStep} total={STEPS.length} />
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm font-medium text-slate-700">
            Step {currentStep + 1} of {STEPS.length}:{' '}
            <span className="text-blue-700">{STEPS[currentStep]}</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={saving || !firebaseUser}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
        </div>
        {saveMessage && (
          <p
            className={`text-xs mt-1 ${
              saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {saveMessage}
          </p>
        )}
      </div>

      {/* Step content */}
      {renderStep()}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-2 print:hidden">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={goNext}>
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving || !firebaseUser}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Resume'}
          </Button>
        )}
      </div>
    </PageContainer>
  );
}
