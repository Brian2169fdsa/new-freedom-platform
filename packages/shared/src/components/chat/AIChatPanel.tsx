import React, { useState, useRef, useEffect } from 'react';
import { sendAIMessage, type ChatMessage, type AgentChatResponse } from '../../services/claude/client';
import { AGENT_DISPLAY } from '../../services/claude/personas';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';

interface AgentMessage extends ChatMessage {
  agentName?: string;
}

export function AIChatPanel() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [currentAgent, setCurrentAgent] = useState('Triage Agent');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const agentDisplay = AGENT_DISPLAY[currentAgent] || AGENT_DISPLAY['Triage Agent'];

  const handleSend = async (content: string) => {
    const userMessage: AgentMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response: AgentChatResponse = await sendAIMessage(content, sessionId);

      // Update session and agent tracking
      setSessionId(response.sessionId);
      setCurrentAgent(response.agentName);

      const assistantMessage: AgentMessage = {
        role: 'assistant',
        content: response.reply,
        agentName: response.agentName,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm sorry, I'm having trouble responding right now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-slate-200">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
          {agentDisplay.avatar}
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">{agentDisplay.name}</h3>
          <p className="text-xs text-slate-500">{agentDisplay.description}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <ChatBubble
            message="Hi there! I'm here to help. Whether you need support with recovery, finding resources, building a resume, or just connecting with someone who understands — tell me what's on your mind."
            isUser={false}
            avatar={
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">
                {agentDisplay.avatar}
              </div>
            }
          />
        )}
        {messages.map((msg, i) => {
          const msgAgent = msg.agentName
            ? AGENT_DISPLAY[msg.agentName]
            : undefined;

          return (
            <div key={i}>
              {/* Show handoff indicator when agent changes */}
              {msg.role === 'assistant' && msg.agentName && i > 0 && (
                (() => {
                  const prevAssistant = messages.slice(0, i).reverse().find((m) => m.role === 'assistant');
                  if (prevAssistant && prevAssistant.agentName !== msg.agentName && msgAgent) {
                    return (
                      <div className="flex justify-center my-2">
                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                          {msgAgent.avatar} Connected to {msgAgent.name}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
              <ChatBubble
                message={msg.content}
                isUser={msg.role === 'user'}
                avatar={
                  msg.role === 'assistant' && msgAgent ? (
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">
                      {msgAgent.avatar}
                    </div>
                  ) : undefined
                }
              />
            </div>
          );
        })}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="flex gap-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
            </div>
            {agentDisplay.name} is typing
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={loading} placeholder="Tell me what you need help with..." />
    </div>
  );
}
