import { useState, useCallback } from 'react';
import {
  PageContainer,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Button,
  Badge,
  Textarea,
  useAuth,
} from '@reprieve/shared';
import { addDocument } from '@reprieve/shared/services/firebase/firestore';
import { chatWithAI } from '@reprieve/shared/services/firebase/functions';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Lightbulb,
  Sparkles,
  Loader2,
  RotateCcw,
  Save,
  CheckCircle2,
  Mic,
  Trophy,
  ArrowRight,
  HardHat,
  Utensils,
  Warehouse,
  ShoppingBag,
  Truck,
  Star,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Industry = 'warehouse' | 'food_service' | 'construction' | 'retail' | 'transportation' | 'general';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';
type Screen = 'setup' | 'session' | 'results';

interface InterviewQuestion {
  readonly question: string;
  readonly coachingTip: string;
  readonly isTricky: boolean;
}

interface AnswerEntry {
  readonly questionIndex: number;
  readonly question: string;
  readonly answer: string;
  readonly aiFeedback: string | null;
}

// ---------------------------------------------------------------------------
// Industry Metadata
// ---------------------------------------------------------------------------

const INDUSTRY_OPTIONS: readonly {
  readonly value: Industry;
  readonly label: string;
  readonly icon: typeof Warehouse;
  readonly color: string;
}[] = [
  { value: 'warehouse', label: 'Warehouse', icon: Warehouse, color: 'bg-blue-100 text-blue-700' },
  { value: 'food_service', label: 'Food Service', icon: Utensils, color: 'bg-orange-100 text-orange-700' },
  { value: 'construction', label: 'Construction', icon: HardHat, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'retail', label: 'Retail', icon: ShoppingBag, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'transportation', label: 'Transportation', icon: Truck, color: 'bg-blue-100 text-blue-700' },
  { value: 'general', label: 'General', icon: Briefcase, color: 'bg-slate-100 text-slate-700' },
] as const;

const DIFFICULTY_OPTIONS: readonly {
  readonly value: Difficulty;
  readonly label: string;
  readonly description: string;
}[] = [
  { value: 'beginner', label: 'Beginner', description: 'Basic questions, extra coaching support' },
  { value: 'intermediate', label: 'Intermediate', description: 'Standard interview questions' },
  { value: 'advanced', label: 'Advanced', description: 'Tough questions, scenario-based' },
] as const;

// ---------------------------------------------------------------------------
// Question Bank (5+ per industry)
// ---------------------------------------------------------------------------

const QUESTION_BANK: Readonly<Record<Industry, readonly InterviewQuestion[]>> = {
  warehouse: [
    {
      question: 'Tell me about yourself and why you are interested in warehouse work.',
      coachingTip: 'Keep it professional and forward-looking. Mention your physical fitness, reliability, and eagerness to work hard. You do not need to share anything personal you are not comfortable with.',
      isTricky: false,
    },
    {
      question: 'Can you describe a time you had to work as part of a team to get a job done?',
      coachingTip: 'Think of any team experience: group projects, sports, community service, or helping others move. Focus on what you contributed and how you communicated.',
      isTricky: false,
    },
    {
      question: 'How do you handle physically demanding work over a long shift?',
      coachingTip: 'Emphasize your stamina, willingness to stay hydrated, take proper breaks, and maintain safety. Mention any physical work you have done before.',
      isTricky: false,
    },
    {
      question: 'Tell me about any gaps in your employment history.',
      coachingTip: 'You can be honest without oversharing. Focus on what you learned or accomplished during that time: certifications, personal growth, programs completed. Say something like "During that period, I focused on personal development and I am now fully committed to building a strong career."',
      isTricky: true,
    },
    {
      question: 'What would you do if you noticed a coworker not following safety procedures?',
      coachingTip: 'Show that you take safety seriously. Say you would respectfully remind them of the procedure, and if it continued, report it to a supervisor. Safety protects everyone.',
      isTricky: false,
    },
    {
      question: 'Why should we hire you for this position?',
      coachingTip: 'This is your chance to sell yourself. Mention your work ethic, dependability, willingness to learn, and any relevant skills like forklift certification or experience with inventory.',
      isTricky: false,
    },
    {
      question: 'Have you ever been convicted of a crime? How would you like to address that?',
      coachingTip: 'In Arizona, many employers cannot ask this until after a conditional offer. If asked, be brief and honest. Focus on accountability and growth: "I take full responsibility for my past. Since then, I have completed [programs/certifications] and I am committed to being a reliable team member." Do not over-explain.',
      isTricky: true,
    },
  ],
  food_service: [
    {
      question: 'Why are you interested in working in food service?',
      coachingTip: 'Talk about enjoying fast-paced environments, working with people, or providing great customer experiences. Mention any cooking, serving, or food safety experience you have.',
      isTricky: false,
    },
    {
      question: 'How would you handle a difficult or upset customer?',
      coachingTip: 'Stay calm, listen to their concern, apologize sincerely, and offer a solution. Say something like: "I would listen to understand their issue, stay respectful, and do my best to make it right."',
      isTricky: false,
    },
    {
      question: 'Can you tell me about a time you had to manage multiple tasks at once?',
      coachingTip: 'Think of any situation where you juggled responsibilities. It does not have to be a job -- managing a daily schedule, helping with meals, coordinating activities all count.',
      isTricky: false,
    },
    {
      question: 'Tell me about any gaps in your work history.',
      coachingTip: 'Keep it positive and brief. Focus on what you did during that time: learning, growing, earning certifications, volunteering. End by saying you are ready and excited to work.',
      isTricky: true,
    },
    {
      question: 'What does good teamwork look like to you?',
      coachingTip: 'Mention communication, helping each other out, being reliable, and treating everyone with respect. Give a brief example if you can.',
      isTricky: false,
    },
    {
      question: 'How do you handle working under pressure during a rush?',
      coachingTip: 'Emphasize staying calm, prioritizing tasks, and communicating with the team. Say you thrive in fast-paced environments and stay focused on getting orders right.',
      isTricky: false,
    },
    {
      question: 'Do you have any experience with food safety or health regulations?',
      coachingTip: 'If you have ServSafe or any food handler certification, mention it. If not, express willingness to get certified and that you understand the importance of hygiene and safety.',
      isTricky: false,
    },
  ],
  construction: [
    {
      question: 'What experience do you have with construction or manual labor?',
      coachingTip: 'Include any hands-on work: building, repairs, landscaping, maintenance, or vocational training. If you learned skills inside a facility, that counts too.',
      isTricky: false,
    },
    {
      question: 'How do you prioritize safety on a job site?',
      coachingTip: 'Talk about always wearing PPE, following instructions, staying aware of your surroundings, and speaking up about hazards. Mention any OSHA training.',
      isTricky: false,
    },
    {
      question: 'Can you describe a challenging physical task you have completed?',
      coachingTip: 'Think about something that required endurance, strength, or problem-solving. Focus on how you pushed through and what you learned from the experience.',
      isTricky: false,
    },
    {
      question: 'How do you explain the gap in your employment?',
      coachingTip: 'Stay positive. Focus on growth during that time. You might say: "I used that time to complete training programs, earn certifications, and prepare myself for a career in construction."',
      isTricky: true,
    },
    {
      question: 'How do you handle disagreements with coworkers on a job site?',
      coachingTip: 'Show maturity. Say you would address it calmly and privately, focus on the task at hand, and involve a supervisor if needed. Construction is a team effort.',
      isTricky: false,
    },
    {
      question: 'What tools and equipment are you comfortable using?',
      coachingTip: 'List any tools you know: power drills, saws, levels, measuring tape, etc. Even basic competence is valuable. Mention willingness to learn new equipment.',
      isTricky: false,
    },
    {
      question: 'Are you willing to work early mornings, overtime, or in extreme weather?',
      coachingTip: 'Show flexibility and toughness. Construction demands it. Say something like: "Absolutely. I understand the nature of the work and I am prepared to show up every day ready to go."',
      isTricky: false,
    },
  ],
  retail: [
    {
      question: 'What interests you about working in retail?',
      coachingTip: 'Mention enjoying helping people, staying busy, and being on your feet. If you have cash handling experience or customer service skills, highlight them.',
      isTricky: false,
    },
    {
      question: 'How would you handle a customer who wants to return an item without a receipt?',
      coachingTip: 'Show you can follow store policy while being respectful. Say you would politely explain the return policy and see if there is an alternative solution.',
      isTricky: false,
    },
    {
      question: 'Tell me about a time you went above and beyond for someone.',
      coachingTip: 'Think of any situation -- helping a neighbor, mentoring someone, doing extra work. Show you care about others and are willing to put in effort.',
      isTricky: false,
    },
    {
      question: 'Can you explain any gaps in your work history?',
      coachingTip: 'Be brief and positive. Focus on personal development, training, or education during that time. Redirect to your current readiness and enthusiasm.',
      isTricky: true,
    },
    {
      question: 'What would you do if you saw another employee stealing?',
      coachingTip: 'Show integrity. Say you would report it to management because honesty and trust are important to you. This shows you are reliable.',
      isTricky: false,
    },
    {
      question: 'How do you stay motivated during slow periods?',
      coachingTip: 'Talk about using downtime productively: restocking, cleaning, organizing, or helping teammates. Show initiative and a strong work ethic.',
      isTricky: false,
    },
    {
      question: 'Are you comfortable handling cash and operating a register?',
      coachingTip: 'Even if you have not used a register, say you are a quick learner. Mention math skills, trustworthiness with money, and attention to detail.',
      isTricky: false,
    },
  ],
  transportation: [
    {
      question: 'Why are you interested in a career in transportation or delivery?',
      coachingTip: 'Mention your reliability, comfort with driving, and desire for independent work. Talk about being organized and detail-oriented.',
      isTricky: false,
    },
    {
      question: 'How do you handle tight delivery deadlines?',
      coachingTip: 'Explain that you plan your route, stay focused, follow traffic laws, and communicate proactively if delays happen. Safety always comes first.',
      isTricky: false,
    },
    {
      question: 'Tell me about a time you had to navigate an unexpected problem.',
      coachingTip: 'Use any real-life example of problem-solving: a detour, broken equipment, schedule change. Show you stay calm and figure things out.',
      isTricky: false,
    },
    {
      question: 'How would you address gaps in your employment during this interview?',
      coachingTip: 'Keep it short and forward-focused. Mention skills or certifications earned during the gap. Express your readiness to work and build a career.',
      isTricky: true,
    },
    {
      question: 'How do you ensure vehicle safety before starting a route?',
      coachingTip: 'Describe a basic pre-trip inspection: checking tires, lights, brakes, mirrors, and fluid levels. Mention any CDL training or defensive driving experience.',
      isTricky: false,
    },
    {
      question: 'What does good customer service look like in a delivery role?',
      coachingTip: 'Talk about being on time, friendly, professional, and handling packages carefully. First impressions matter when you represent a company.',
      isTricky: false,
    },
  ],
  general: [
    {
      question: 'Tell me about yourself.',
      coachingTip: 'Keep it to 60-90 seconds. Focus on: who you are professionally, your strongest skills, and what you are looking for. Do not feel pressured to share your entire life story.',
      isTricky: false,
    },
    {
      question: 'What are your greatest strengths?',
      coachingTip: 'Pick 2-3 strengths relevant to the job: reliability, hard work, quick learner, communication, problem-solving. Give a brief example for each.',
      isTricky: false,
    },
    {
      question: 'What is your biggest weakness?',
      coachingTip: 'Pick something real but manageable. Show self-awareness and what you are doing to improve. Example: "I sometimes focus too much on details, so I have been working on managing my time better."',
      isTricky: true,
    },
    {
      question: 'Can you explain any gaps in your employment?',
      coachingTip: 'Be honest but brief. Focus on what you gained: skills, certifications, personal growth, programs completed. End on a positive note about being ready to contribute.',
      isTricky: true,
    },
    {
      question: 'Where do you see yourself in one year?',
      coachingTip: 'Show ambition and stability. Say you want to be established in this role, learning and growing. Employers want to know you will stick around.',
      isTricky: false,
    },
    {
      question: 'Why should we hire you?',
      coachingTip: 'Summarize your best qualities: work ethic, reliability, eagerness to learn, and any relevant skills. Make it about what you bring to the team.',
      isTricky: false,
    },
    {
      question: 'How do you handle conflict or disagreements at work?',
      coachingTip: 'Emphasize communication, staying calm, listening to the other person, and finding common ground. Show emotional maturity and respect.',
      isTricky: false,
    },
    {
      question: 'Do you have any questions for us?',
      coachingTip: 'Always say yes. Good questions: "What does a typical day look like?" or "What opportunities are there for growth?" or "What does success look like in this role?" This shows genuine interest.',
      isTricky: false,
    },
  ],
} as const;

const GENERAL_COACHING_TIPS: readonly string[] = [
  'Practice makes progress. Every interview you do -- even a mock one -- builds your confidence.',
  'Dress one level above what the job requires. First impressions matter.',
  'Arrive 10-15 minutes early. It shows respect and reliability.',
  'Bring copies of your resume, any certifications, and a list of references.',
  'Make eye contact, offer a firm handshake, and smile. You belong there.',
  'It is okay to pause and think before answering. Thoughtful answers are better than rushed ones.',
  'If you do not know an answer, say: "That is a great question. I would approach it by..." and give your best answer.',
  'Many Arizona employers are fair-chance employers. Your past does not define your future.',
  'After the interview, send a thank-you message or email. It sets you apart.',
  'Remember: the interviewer wants you to succeed. They are looking for someone to fill the role -- that could be you.',
] as const;

// ---------------------------------------------------------------------------
// Helper: Select questions based on difficulty
// ---------------------------------------------------------------------------

function selectQuestions(industry: Industry, difficulty: Difficulty): readonly InterviewQuestion[] {
  const pool = QUESTION_BANK[industry];

  switch (difficulty) {
    case 'beginner': {
      // Beginner: 5 questions, fewer tricky ones
      const nonTricky = pool.filter((q) => !q.isTricky);
      return nonTricky.slice(0, 5);
    }
    case 'intermediate': {
      // Intermediate: 6 questions, include 1 tricky
      const tricky = pool.filter((q) => q.isTricky).slice(0, 1);
      const nonTricky = pool.filter((q) => !q.isTricky).slice(0, 5);
      return [...nonTricky, ...tricky];
    }
    case 'advanced': {
      // Advanced: all questions including all tricky ones
      return pool;
    }
    default:
      return pool;
  }
}

// ---------------------------------------------------------------------------
// Sub-component: Industry Selector Card
// ---------------------------------------------------------------------------

function IndustrySelector({
  selected,
  onSelect,
}: {
  selected: Industry | null;
  onSelect: (industry: Industry) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {INDUSTRY_OPTIONS.map(({ value, label, icon: Icon, color }) => {
        const isSelected = selected === value;
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
            }`}
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className={`text-sm font-medium ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Difficulty Selector
// ---------------------------------------------------------------------------

function DifficultySelector({
  selected,
  onSelect,
}: {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
}) {
  return (
    <div className="space-y-2">
      {DIFFICULTY_OPTIONS.map(({ value, label, description }) => {
        const isSelected = selected === value;
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-blue-300'
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'border-blue-500' : 'border-slate-300'
              }`}
            >
              {isSelected && <div className="h-2 w-2 rounded-full bg-blue-500" />}
            </div>
            <div>
              <p className={`text-sm font-medium ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                {label}
              </p>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Progress Indicator
// ---------------------------------------------------------------------------

function ProgressIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors ${
            i < current ? 'bg-blue-600' : i === current ? 'bg-blue-400' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Coaching Tip Toggle
// ---------------------------------------------------------------------------

function CoachingTipSection({ tip }: { tip: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50/50 overflow-hidden">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-blue-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm font-medium text-blue-800">Coaching Tip</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-blue-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-blue-600" />
        )}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 pt-0">
          <p className="text-sm text-blue-900 leading-relaxed">{tip}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: AI Feedback Section
// ---------------------------------------------------------------------------

function AIFeedbackSection({
  question,
  answer,
  feedback,
  onFeedbackReceived,
}: {
  question: string;
  answer: string;
  feedback: string | null;
  onFeedbackReceived: (feedback: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetFeedback = useCallback(async () => {
    if (!answer.trim()) return;

    setLoading(true);
    setError('');

    try {
      const prompt =
        `You are a supportive interview coach helping a re-entry candidate prepare for job interviews. ` +
        `The candidate was asked: "${question}" ` +
        `Their answer was: "${answer}" ` +
        `Provide brief, encouraging feedback (3-4 sentences). Highlight what they did well, ` +
        `suggest one specific improvement, and end with encouragement. ` +
        `Do NOT mention criminal history, incarceration, or anything negative about their past. ` +
        `Keep the tone warm, professional, and empowering.`;

      const result = await chatWithAI({ message: prompt });
      onFeedbackReceived(result.data.reply);
    } catch (err) {
      console.error('AI feedback failed:', err);
      setError('Could not get AI feedback right now. Keep practicing -- you are doing great.');
    } finally {
      setLoading(false);
    }
  }, [question, answer, onFeedbackReceived]);

  if (feedback) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-purple-800 mb-1">AI Coach Feedback</p>
              <p className="text-sm text-slate-700 leading-relaxed">{feedback}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleGetFeedback}
        disabled={loading || !answer.trim()}
        className="border-purple-300 text-purple-700 hover:bg-purple-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        {loading ? 'Getting Feedback...' : 'Get AI Feedback'}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!answer.trim() && (
        <p className="text-xs text-slate-400">Write your answer first to get personalized feedback.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen: Setup
// ---------------------------------------------------------------------------

function SetupScreen({
  onStart,
}: {
  onStart: (industry: Industry, difficulty: Difficulty) => void;
}) {
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-slate-50 border-blue-200">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Mic className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">Welcome to Mock Interview Practice</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Practicing interviews is one of the best ways to build confidence. Here, you will go through
                real interview questions one at a time, with helpful coaching tips along the way. There are
                no wrong answers -- this is your safe space to practice and improve.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Choose your industry and difficulty level below.' },
              { step: '2', text: 'Answer each interview question one at a time in writing.' },
              { step: '3', text: 'Use the coaching tips to guide your answers.' },
              { step: '4', text: 'Optionally get AI-powered feedback on each answer.' },
              { step: '5', text: 'Review your results and save your practice session.' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {step}
                </span>
                <p className="text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Industry Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Your Industry</CardTitle>
          <CardDescription>Choose the field you are interviewing for.</CardDescription>
        </CardHeader>
        <CardContent>
          <IndustrySelector selected={industry} onSelect={setIndustry} />
        </CardContent>
      </Card>

      {/* Difficulty Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Difficulty</CardTitle>
          <CardDescription>Start with Beginner if this is your first time.</CardDescription>
        </CardHeader>
        <CardContent>
          <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
        </CardContent>
      </Card>

      {/* Start Button */}
      <Button
        onClick={() => {
          if (industry) {
            onStart(industry, difficulty);
          }
        }}
        disabled={!industry}
        className="w-full py-6 text-base"
        size="lg"
      >
        <Mic className="h-5 w-5 mr-2" />
        Start Interview
      </Button>

      {!industry && (
        <p className="text-center text-xs text-slate-400">Select an industry to begin.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen: Interview Session
// ---------------------------------------------------------------------------

function SessionScreen({
  questions,
  industry,
  difficulty,
  onComplete,
}: {
  questions: readonly InterviewQuestion[];
  industry: Industry;
  difficulty: Difficulty;
  onComplete: (answers: readonly AnswerEntry[]) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<readonly AnswerEntry[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const industryLabel = INDUSTRY_OPTIONS.find((o) => o.value === industry)?.label ?? industry;

  const handleUpdateAIFeedback = useCallback(
    (feedback: string) => {
      setAnswers((prev) => {
        const existing = prev.find((a) => a.questionIndex === currentIndex);
        if (existing) {
          return prev.map((a) =>
            a.questionIndex === currentIndex ? { ...a, aiFeedback: feedback } : a
          );
        }
        return [
          ...prev,
          {
            questionIndex: currentIndex,
            question: currentQuestion.question,
            answer: currentAnswer,
            aiFeedback: feedback,
          },
        ];
      });
    },
    [currentIndex, currentQuestion.question, currentAnswer]
  );

  const handleNext = () => {
    const updatedAnswers: readonly AnswerEntry[] = (() => {
      const existing = answers.find((a) => a.questionIndex === currentIndex);
      if (existing) {
        return answers.map((a) =>
          a.questionIndex === currentIndex ? { ...a, answer: currentAnswer } : a
        );
      }
      return [
        ...answers,
        {
          questionIndex: currentIndex,
          question: currentQuestion.question,
          answer: currentAnswer,
          aiFeedback: null,
        },
      ];
    })();

    setAnswers(updatedAnswers);

    if (isLastQuestion) {
      onComplete(updatedAnswers);
    } else {
      setCurrentIndex((prev) => prev + 1);
      // Load previous answer if going forward to a question that was already answered
      const nextAnswer = updatedAnswers.find((a) => a.questionIndex === currentIndex + 1);
      setCurrentAnswer(nextAnswer?.answer ?? '');
    }
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return;

    // Save current answer before going back
    const updatedAnswers: readonly AnswerEntry[] = (() => {
      const existing = answers.find((a) => a.questionIndex === currentIndex);
      if (existing) {
        return answers.map((a) =>
          a.questionIndex === currentIndex ? { ...a, answer: currentAnswer } : a
        );
      }
      return [
        ...answers,
        {
          questionIndex: currentIndex,
          question: currentQuestion.question,
          answer: currentAnswer,
          aiFeedback: null,
        },
      ];
    })();

    setAnswers(updatedAnswers);
    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    const prevAnswer = updatedAnswers.find((a) => a.questionIndex === prevIndex);
    setCurrentAnswer(prevAnswer?.answer ?? '');
  };

  const currentFeedback = answers.find((a) => a.questionIndex === currentIndex)?.aiFeedback ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{industryLabel}</Badge>
        <Badge variant="outline" className="capitalize">{difficulty}</Badge>
      </div>

      {/* Progress */}
      <div>
        <ProgressIndicator current={currentIndex} total={questions.length} />
        <p className="text-sm font-medium text-slate-600 mt-2">
          Question {currentIndex + 1} of {questions.length}
        </p>
      </div>

      {/* Question Card */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            {currentQuestion.isTricky && (
              <Badge variant="warning" className="flex-shrink-0 mt-0.5">
                Tricky
              </Badge>
            )}
            <p className="text-lg font-medium text-slate-800 leading-relaxed">
              {currentQuestion.question}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Answer Area */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Your Answer</label>
        <Textarea
          rows={5}
          placeholder="Type your answer here. Take your time -- there is no timer. Think about what you would actually say in the interview..."
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          className="resize-y"
        />
        {currentAnswer.trim().length > 0 && (
          <p className="text-xs text-slate-400 mt-1">
            {currentAnswer.trim().split(/\s+/).length} words
          </p>
        )}
      </div>

      {/* Coaching Tip */}
      <CoachingTipSection tip={currentQuestion.coachingTip} />

      {/* AI Feedback */}
      <AIFeedbackSection
        question={currentQuestion.question}
        answer={currentAnswer}
        feedback={currentFeedback}
        onFeedbackReceived={handleUpdateAIFeedback}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <Button onClick={handleNext}>
          {isLastQuestion ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Finish Interview
            </>
          ) : (
            <>
              Next Question
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen: Results
// ---------------------------------------------------------------------------

function ResultsScreen({
  answers,
  industry,
  difficulty,
  onRestart,
}: {
  answers: readonly AnswerEntry[];
  industry: Industry;
  difficulty: Difficulty;
  onRestart: () => void;
}) {
  const { firebaseUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const answeredCount = answers.filter((a) => a.answer.trim().length > 0).length;
  const feedbackCount = answers.filter((a) => a.aiFeedback !== null).length;
  const industryLabel = INDUSTRY_OPTIONS.find((o) => o.value === industry)?.label ?? industry;

  const handleSave = useCallback(async () => {
    if (!firebaseUser?.uid) return;

    setSaving(true);
    setSaveError('');

    try {
      await addDocument('mockInterviewSessions', {
        userId: firebaseUser.uid,
        industry,
        difficulty,
        answers: answers.map((a) => ({
          questionIndex: a.questionIndex,
          question: a.question,
          answer: a.answer,
          aiFeedback: a.aiFeedback,
        })),
        questionsTotal: answers.length,
        questionsAnswered: answeredCount,
        completedAt: new Date().toISOString(),
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save practice session:', err);
      setSaveError('Could not save your session. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [firebaseUser, industry, difficulty, answers, answeredCount]);

  return (
    <div className="space-y-6">
      {/* Congratulations Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-yellow-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Great Job! Interview Complete</h3>
          <p className="text-sm text-slate-600">
            You just practiced {answeredCount} interview question{answeredCount !== 1 ? 's' : ''} for{' '}
            <span className="font-medium text-blue-700">{industryLabel}</span>. Every practice session
            makes you stronger and more prepared. Keep it up!
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{answers.length}</p>
              <p className="text-xs text-slate-500">Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{answeredCount}</p>
              <p className="text-xs text-slate-500">Answered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{feedbackCount}</p>
              <p className="text-xs text-slate-500">AI Feedback</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answers Review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Answers</CardTitle>
          <CardDescription>Review what you wrote for each question.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {answers.map((entry, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-medium text-slate-800">{entry.question}</p>
                </div>
                {entry.answer.trim() ? (
                  <div className="ml-8">
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{entry.answer}</p>
                  </div>
                ) : (
                  <div className="ml-8">
                    <p className="text-sm text-slate-400 italic">No answer provided</p>
                  </div>
                )}
                {entry.aiFeedback && (
                  <div className="ml-8">
                    <div className="flex items-start gap-2 bg-purple-50 rounded-lg p-3">
                      <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-purple-800">{entry.aiFeedback}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* General Coaching Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-blue-500" />
            Tips for Fair-Chance Interviews
          </CardTitle>
          <CardDescription>
            Keep these in mind for your real interviews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {GENERAL_COACHING_TIPS.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600">{tip}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || saved || !firebaseUser}
          className="flex-1"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Saving...' : saved ? 'Session Saved' : 'Save Practice Session'}
        </Button>
        <Button variant="outline" onClick={onRestart} className="flex-1">
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>

      {saveError && <p className="text-sm text-red-600 text-center">{saveError}</p>}
      {saved && (
        <p className="text-sm text-green-600 text-center">
          Your practice session has been saved. You can review it later in your profile.
        </p>
      )}
      {!firebaseUser && (
        <p className="text-xs text-slate-400 text-center">Log in to save your practice sessions.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function MockInterview() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [industry, setIndustry] = useState<Industry>('general');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [questions, setQuestions] = useState<readonly InterviewQuestion[]>([]);
  const [completedAnswers, setCompletedAnswers] = useState<readonly AnswerEntry[]>([]);

  const handleStart = (selectedIndustry: Industry, selectedDifficulty: Difficulty) => {
    setIndustry(selectedIndustry);
    setDifficulty(selectedDifficulty);
    setQuestions(selectQuestions(selectedIndustry, selectedDifficulty));
    setCompletedAnswers([]);
    setScreen('session');
  };

  const handleComplete = (answers: readonly AnswerEntry[]) => {
    setCompletedAnswers(answers);
    setScreen('results');
  };

  const handleRestart = () => {
    setScreen('setup');
    setQuestions([]);
    setCompletedAnswers([]);
  };

  return (
    <PageContainer
      title="Mock Interview"
      subtitle="Practice makes progress -- you've got this"
    >
      {/* Back link */}
      <Link
        to="/tools"
        className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800 -mt-2 mb-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Tools
      </Link>

      {screen === 'setup' && <SetupScreen onStart={handleStart} />}

      {screen === 'session' && (
        <SessionScreen
          questions={questions}
          industry={industry}
          difficulty={difficulty}
          onComplete={handleComplete}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          answers={completedAnswers}
          industry={industry}
          difficulty={difficulty}
          onRestart={handleRestart}
        />
      )}
    </PageContainer>
  );
}
