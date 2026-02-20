import React, { useState, useRef, useEffect } from 'react';
import { sendAIMessage, type AIPersona, type ChatMessage } from '../../services/claude/client';
import { PERSONAS } from '../../services/claude/personas';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { Avatar } from '../ui/avatar';

interface AIChatPanelProps {
  persona: AIPersona;
}

export function AIChatPanel({ persona }: AIChatPanelProps) {
  const config = PERSONAS[persona];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content: string) => {
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const reply = await sendAIMessage(persona, content, messages);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
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
    <div className="flex flex-col h-full bg-stone-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-stone-200">
        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-lg">
          {config.avatar}
        </div>
        <div>
          <h3 className="font-semibold text-stone-800 text-sm">{config.name}</h3>
          <p className="text-xs text-stone-500">{config.description}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <ChatBubble
            message={config.greeting}
            isUser={false}
            avatar={
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                {config.avatar}
              </div>
            }
          />
        )}
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            message={msg.content}
            isUser={msg.role === 'user'}
            avatar={
              msg.role === 'assistant' ? (
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                  {config.avatar}
                </div>
              ) : undefined
            }
          />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-stone-400 text-sm">
            <div className="flex gap-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
            </div>
            {config.name} is typing
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={loading} placeholder={`Ask ${config.name}...`} />
    </div>
  );
}
