import React, { useState } from 'react';
import { Image, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Avatar } from '../ui/avatar';
import { useAuth } from '../../hooks/useAuth';

interface PostComposerProps {
  onSubmit: (content: string, isAnonymous: boolean) => void;
  placeholder?: string;
}

export function PostComposer({ onSubmit, placeholder = "Share your thoughts..." }: PostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim(), isAnonymous);
      setContent('');
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar
            src={isAnonymous ? null : user?.photoURL}
            alt={isAnonymous ? 'Anonymous' : user?.displayName}
            fallback={isAnonymous ? 'A' : user?.profile?.firstName?.charAt(0)}
            size="md"
          />
          <div className="flex-1">
            <Textarea
              placeholder={placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[60px] resize-none border-0 p-0 focus:ring-0"
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-3">
                <button className="text-stone-400 hover:text-stone-600">
                  <Image className="h-5 w-5" />
                </button>
                <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                  />
                  Post anonymously
                </label>
              </div>
              <Button size="sm" onClick={handleSubmit} disabled={!content.trim()}>
                <Send className="h-4 w-4 mr-1" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
