import React, { useState } from 'react';
import { useAuth, useCollection, type Post } from '@reprieve/shared';
import { where, orderBy } from 'firebase/firestore';
import { addDocument } from '@reprieve/shared/services/firebase/firestore';
import {
  BookHeart, Clock, Heart, MessageCircle, PenSquare, Send,
  ChevronRight, Eye, EyeOff, Bookmark, X,
} from 'lucide-react';

const STORY_PROMPTS = [
  'What moment made you realize you needed a change?',
  "What's the hardest part of your journey so far?",
  'Describe a small victory you had this week.',
  'What advice would you give someone just starting out?',
  'Who helped you when you needed it most?',
];

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function StoryCard({ story, currentUserId }: { story: Post; currentUserId: string }) {
  const isLiked = story.likes.includes(currentUserId);
  const timeAgo = story.createdAt?.toDate ? formatTimeAgo(story.createdAt.toDate()) : '';
  const preview = story.content.length > 200 ? story.content.substring(0, 200) + '...' : story.content;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      {/* Story Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
          {story.isAnonymous ? (
            <BookHeart className="h-5 w-5 text-amber-700" />
          ) : (
            <span className="text-sm font-medium text-amber-800">
              {story.authorId?.substring(0, 2).toUpperCase() || '??'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-stone-800 text-sm">
            {story.isAnonymous ? 'Anonymous Storyteller' : 'Community Member'}
          </p>
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
          Story
        </span>
      </div>

      {/* Story Content */}
      <div className="px-4 pb-3">
        <p className="text-stone-700 text-sm whitespace-pre-wrap leading-relaxed">
          {expanded ? story.content : preview}
        </p>
        {story.content.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-amber-600 text-xs font-medium hover:text-amber-700"
          >
            {expanded ? 'Show less' : 'Read full story'}
            <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>

      {/* Moderation */}
      {story.moderationStatus === 'pending' && (
        <div className="mx-4 mb-3 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          Awaiting review before visible to others
        </div>
      )}

      {/* Engagement */}
      <div className="flex items-center gap-1 px-4 py-2 border-t border-stone-100">
        <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          isLiked ? 'text-red-500 bg-red-50' : 'text-stone-500 hover:bg-stone-100'
        }`}>
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          {story.likes.length > 0 && <span>{story.likes.length}</span>}
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:bg-stone-100">
          <MessageCircle className="h-4 w-4" />
          {story.commentCount > 0 && <span>{story.commentCount}</span>}
        </button>
        <div className="flex-1" />
        <button className="text-stone-400 hover:text-amber-600 p-1.5">
          <Bookmark className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StoryComposer({ onSubmit }: { onSubmit: (content: string, isAnonymous: boolean) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [posting, setPosting] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    await onSubmit(content.trim(), isAnonymous);
    setContent('');
    setPosting(false);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 bg-white rounded-xl border border-stone-200 p-4 text-left hover:border-amber-300 transition-colors"
      >
        <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
          <PenSquare className="h-5 w-5 text-amber-600" />
        </div>
        <span className="text-sm text-stone-400">Share your story...</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-stone-800 text-sm">Write Your Story</h3>
        <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Writing Prompts */}
      <div className="mb-3">
        <p className="text-xs text-stone-500 mb-2">Need inspiration? Try a prompt:</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {STORY_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setActivePrompt(prompt);
                setContent((prev) => prev || prompt + '\n\n');
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors ${
                activePrompt === prompt
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {prompt.substring(0, 40)}...
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Tell your story. Every journey matters..."
        className="w-full resize-none bg-stone-50 rounded-lg border border-stone-200 p-3 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 min-h-[160px]"
        rows={6}
      />

      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => setIsAnonymous(!isAnonymous)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
            isAnonymous ? 'bg-amber-100 text-amber-700' : 'text-stone-400 hover:text-stone-600 bg-stone-100'
          }`}
        >
          {isAnonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {isAnonymous ? 'Anonymous' : 'Public'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || posting}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {posting ? 'Publishing...' : (
            <>
              <Send className="h-3.5 w-3.5" /> Publish Story
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-stone-200 p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-stone-200" />
            <div className="space-y-1.5">
              <div className="h-3 w-28 bg-stone-200 rounded" />
              <div className="h-2.5 w-16 bg-stone-100 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-stone-200 rounded" />
            <div className="h-3 w-full bg-stone-200 rounded" />
            <div className="h-3 w-3/4 bg-stone-200 rounded" />
            <div className="h-3 w-1/2 bg-stone-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Stories() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || '';

  const { data: stories, loading } = useCollection<Post>(
    'posts',
    where('type', '==', 'story'),
    where('moderationStatus', 'in', ['approved', 'pending']),
    orderBy('createdAt', 'desc')
  );

  const handleNewStory = async (content: string, isAnonymous: boolean) => {
    if (!uid) return;
    await addDocument('posts', {
      authorId: uid,
      type: 'story' as const,
      content,
      mediaURLs: [],
      likes: [],
      commentCount: 0,
      isAnonymous,
      moderationStatus: 'pending',
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-stone-800">Community Stories</h1>
        <p className="text-sm text-stone-500 mt-0.5">Real stories from real people. You are not alone.</p>
      </div>

      <StoryComposer onSubmit={handleNewStory} />

      {loading ? (
        <LoadingSkeleton />
      ) : stories.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <BookHeart className="h-10 w-10 text-stone-300 mx-auto" />
          <h3 className="font-medium text-stone-800 mt-3">No stories yet</h3>
          <p className="text-sm text-stone-500 mt-1">
            Be the first to share your journey. Your story could help someone else feel less alone.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-stone-400">{stories.length} stories shared</p>
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} currentUserId={uid} />
          ))}
        </div>
      )}
    </div>
  );
}
