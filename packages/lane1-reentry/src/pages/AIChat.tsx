import { useState, useRef, useEffect, useCallback } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  useAuth,
  CRISIS_HOTLINE,
} from '@reprieve/shared';
import { chatWithAI } from '@reprieve/shared/services/firebase/functions';
import {
  Heart,
  Compass,
  MapPin,
  Briefcase,
  Send,
  Loader2,
  Phone,
  MessageSquare,
  AlertTriangle,
  Bot,
  User,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly agentName?: string;
  readonly timestamp: number;
}

interface Persona {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: React.ElementType;
  readonly color: string;
  readonly bgColor: string;
  readonly borderColor: string;
  readonly textColor: string;
  readonly lightBg: string;
  readonly systemContext: string;
}

// ---------------------------------------------------------------------------
// Persona Definitions
// ---------------------------------------------------------------------------

const PERSONAS: readonly Persona[] = [
  {
    id: 'recovery-guide',
    name: 'Recovery Guide',
    description: '24/7 emotional support & crisis detection',
    icon: Heart,
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    lightBg: 'bg-emerald-100',
    systemContext:
      'You are a compassionate recovery guide helping someone in their re-entry journey. Provide emotional support, encourage healthy coping strategies, and be attentive to signs of crisis. Always respond with empathy and warmth.',
  },
  {
    id: 'life-navigator',
    name: 'Life Navigator',
    description: 'Housing, benefits, legal & transport Q&A',
    icon: Compass,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    lightBg: 'bg-blue-100',
    systemContext:
      'You are a knowledgeable life navigator helping with practical re-entry challenges including housing, government benefits, legal questions, transportation, and daily life skills. Provide clear, actionable guidance.',
  },
  {
    id: 'resource-finder',
    name: 'Resource Finder',
    description: 'Phoenix AZ area services & help locator',
    icon: MapPin,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    lightBg: 'bg-purple-100',
    systemContext:
      'You are a resource finder specializing in Phoenix, AZ services for people in recovery and re-entry. Help locate shelters, food banks, treatment centers, legal aid, employment services, and community organizations in the greater Phoenix metropolitan area.',
  },
  {
    id: 'resume-coach',
    name: 'Resume Coach',
    description: 'Employment prep, interview tips & resumes',
    icon: Briefcase,
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    lightBg: 'bg-amber-100',
    systemContext:
      'You are a career coach specializing in fair-chance employment for individuals with justice involvement. Help with resume writing, interview preparation, job search strategies, and navigating background check conversations with empathy and practical advice.',
  },
] as const;

// ---------------------------------------------------------------------------
// Welcome messages per persona
// ---------------------------------------------------------------------------

function getWelcomeMessage(persona: Persona): ChatMessage {
  const welcomeMessages: Record<string, string> = {
    'recovery-guide':
      "Hi, I'm your Recovery Guide. I'm here for you 24/7 -- whether you need someone to talk to, help working through a tough moment, or just a little encouragement. How are you feeling today?",
    'life-navigator':
      "Hello! I'm your Life Navigator. I can help you figure out housing options, government benefits, legal questions, transportation, and other practical challenges you might be facing. What do you need help with?",
    'resource-finder':
      "Hey there! I'm your Resource Finder for the Phoenix, AZ area. I can help you locate shelters, food banks, treatment centers, legal aid, job training programs, and more. What kind of resource are you looking for?",
    'resume-coach':
      "Welcome! I'm your Resume Coach. I specialize in helping people with justice involvement build strong resumes, prepare for interviews, and find fair-chance employers. Ready to work on your career goals?",
  };

  return {
    role: 'assistant',
    content: welcomeMessages[persona.id] ?? `Hi! I'm your ${persona.name}. How can I help you today?`,
    agentName: persona.name,
    timestamp: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PersonaSelectorBar({
  personas,
  activePersonaId,
  onSelect,
}: {
  readonly personas: readonly Persona[];
  readonly activePersonaId: string;
  readonly onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {personas.map((persona) => {
        const Icon = persona.icon;
        const isActive = persona.id === activePersonaId;

        return (
          <button
            key={persona.id}
            onClick={() => onSelect(persona.id)}
            className={`
              flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl
              text-sm font-medium transition-all duration-200
              ${
                isActive
                  ? `${persona.color} text-white shadow-md scale-[1.02]`
                  : `${persona.bgColor} ${persona.textColor} hover:shadow-sm border ${persona.borderColor}`
              }
            `}
            aria-pressed={isActive}
            aria-label={`Switch to ${persona.name}`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{persona.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function CrisisAlertBanner() {
  return (
    <div className="mx-4 mt-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-red-800 text-sm">
            We noticed you may be in crisis
          </p>
          <p className="text-red-700 text-sm mt-1">
            You are not alone. Please reach out to someone who can help right now.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <a
              href={`tel:${CRISIS_HOTLINE.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              Call {CRISIS_HOTLINE.phone}
            </a>
            <span className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg">
              {CRISIS_HOTLINE.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HandoffNotice({ agentName }: { readonly agentName: string }) {
  return (
    <div className="flex justify-center my-3">
      <Badge className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 text-xs">
        <Bot className="h-3 w-3 mr-1.5 inline" />
        You have been connected to {agentName}
      </Badge>
    </div>
  );
}

function TypingIndicator({ persona }: { readonly persona: Persona }) {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div
        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${persona.lightBg}`}
      >
        <Bot className={`h-4 w-4 ${persona.textColor}`} />
      </div>
      <div className="bg-stone-100 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  persona,
}: {
  readonly message: ChatMessage;
  readonly persona: Persona;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
          isUser ? 'bg-amber-100' : persona.lightBg
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-amber-700" />
        ) : (
          <Bot className={`h-4 w-4 ${persona.textColor}`} />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-amber-700 text-white rounded-br-md'
            : 'bg-stone-100 text-stone-800 rounded-bl-md'
        }`}
      >
        {!isUser && message.agentName && (
          <p className={`text-xs font-medium ${persona.textColor} mb-1`}>
            {message.agentName}
          </p>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

function EmptyState({ persona }: { readonly persona: Persona }) {
  const Icon = persona.icon;

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
      <div
        className={`flex items-center justify-center w-16 h-16 rounded-2xl ${persona.lightBg} mb-4`}
      >
        <Icon className={`h-8 w-8 ${persona.textColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-stone-800 mb-1">{persona.name}</h3>
      <p className="text-sm text-stone-500 max-w-sm">{persona.description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AIChat() {
  const { user } = useAuth();

  // Active persona
  const [activePersonaId, setActivePersonaId] = useState<string>(PERSONAS[0].id);
  const activePersona = PERSONAS.find((p) => p.id === activePersonaId) ?? PERSONAS[0];

  // Per-persona state maps (keyed by persona ID)
  const [messagesMap, setMessagesMap] = useState<Record<string, readonly ChatMessage[]>>(() => {
    // Initialize each persona with its welcome message
    const initial: Record<string, readonly ChatMessage[]> = {};
    for (const persona of PERSONAS) {
      initial[persona.id] = [getWelcomeMessage(persona)];
    }
    return initial;
  });

  const [sessionIdMap, setSessionIdMap] = useState<Record<string, string | undefined>>({});
  const [crisisDetectedMap, setCrisisDetectedMap] = useState<Record<string, boolean>>({});
  const [lastHandoffMap, setLastHandoffMap] = useState<Record<string, string | undefined>>({});

  // UI state
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derived state for active persona
  const messages = messagesMap[activePersonaId] ?? [];
  const sessionId = sessionIdMap[activePersonaId];
  const crisisDetected = crisisDetectedMap[activePersonaId] ?? false;
  const lastHandoff = lastHandoffMap[activePersonaId];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when persona changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [activePersonaId]);

  // Handle persona switch
  const handlePersonaSwitch = useCallback(
    (personaId: string) => {
      if (personaId === activePersonaId) return;
      setActivePersonaId(personaId);
      setError(null);
    },
    [activePersonaId],
  );

  // Send message
  const sendMessage = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    setInputValue('');
    setError(null);

    // Build user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    // Append user message (immutable)
    setMessagesMap((prev) => ({
      ...prev,
      [activePersonaId]: [...(prev[activePersonaId] ?? []), userMessage],
    }));

    setIsLoading(true);

    try {
      // Prepend system context to the message for the AI
      const contextualMessage = `[System Context: ${activePersona.systemContext}]\n\nUser: ${trimmed}`;

      const result = await chatWithAI({
        message: contextualMessage,
        sessionId,
      });

      const data = result.data;

      // Update session ID (immutable)
      if (data.sessionId) {
        setSessionIdMap((prev) => ({ ...prev, [activePersonaId]: data.sessionId }));
      }

      // Build assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.reply,
        agentName: data.agentName || activePersona.name,
        timestamp: Date.now(),
      };

      // Append assistant message (immutable)
      setMessagesMap((prev) => ({
        ...prev,
        [activePersonaId]: [...(prev[activePersonaId] ?? []), assistantMessage],
      }));

      // Crisis detection
      if (data.crisisDetected) {
        setCrisisDetectedMap((prev) => ({ ...prev, [activePersonaId]: true }));
      }

      // Handoff detection
      if (data.handoffOccurred && data.agentName) {
        setLastHandoffMap((prev) => ({ ...prev, [activePersonaId]: data.agentName }));
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, activePersonaId, activePersona, sessionId]);

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  // Determine if we should show the handoff notice before the last assistant message
  const lastAssistantIdx = messages.length - 1;
  const showHandoffBeforeIdx =
    lastHandoff && messages[lastAssistantIdx]?.role === 'assistant'
      ? lastAssistantIdx
      : -1;

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${activePersona.color}`}>
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-800">AI Assistant</h1>
            <p className="text-xs text-stone-500">
              {user?.profile?.firstName
                ? `Here for you, ${user.profile.firstName}`
                : 'Your personal support team'}
            </p>
          </div>
        </div>

        {/* ── Persona Selector ──────────────────────────────────────── */}
        <PersonaSelectorBar
          personas={PERSONAS}
          activePersonaId={activePersonaId}
          onSelect={handlePersonaSwitch}
        />

        {/* ── Chat Area ─────────────────────────────────────────────── */}
        <Card className="flex-1 flex flex-col border-none shadow-sm mt-4 overflow-hidden">
          {/* Crisis Alert */}
          {crisisDetected && <CrisisAlertBanner />}

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-0">
            {messages.length === 0 ? (
              <EmptyState persona={activePersona} />
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div key={`${activePersonaId}-${msg.timestamp}-${idx}`}>
                    {/* Show handoff notice just before the relevant message */}
                    {idx === showHandoffBeforeIdx && lastHandoff && (
                      <HandoffNotice agentName={lastHandoff} />
                    )}
                    <MessageBubble message={msg} persona={activePersona} />
                  </div>
                ))}

                {isLoading && <TypingIndicator persona={activePersona} />}
              </>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Error message */}
          {error && (
            <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </p>
            </div>
          )}

          {/* ── Input Area ────────────────────────────────────────── */}
          <div className="p-4 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${activePersona.name}...`}
                disabled={isLoading}
                className="flex-1"
                aria-label="Type your message"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className={`${activePersona.color} hover:opacity-90 text-white`}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-stone-400 mt-2 text-center">
              AI responses are supportive guidance, not professional advice.
              {' '}
              In an emergency, call{' '}
              <a
                href={`tel:${CRISIS_HOTLINE.phone}`}
                className="text-amber-600 hover:text-amber-700 font-medium underline"
              >
                {CRISIS_HOTLINE.phone}
              </a>
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
