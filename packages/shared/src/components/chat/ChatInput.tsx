import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/button';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ onSend, placeholder = 'Type a message...', disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-white border-t border-slate-200">
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 h-10 rounded-full border border-slate-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className="rounded-full h-10 w-10"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
