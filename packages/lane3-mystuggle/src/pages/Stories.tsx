import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useCollection, type Post } from '@reprieve/shared';
import { where, orderBy } from 'firebase/firestore';
import { addDocument, deleteDocument, getDocuments } from '@reprieve/shared/services/firebase/firestore';
import { uploadFile } from '@reprieve/shared/services/firebase/storage';
import { likePost, unlikePost } from '@reprieve/shared/services/firebase/functions';
import {
  BookHeart, Clock, Heart, Image, MessageCircle, PenSquare, Send,
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

function StoryCard({
  story,
  currentUserId,
  isBookmarked,
  onToggleBookmark,
}: {
  story: Post;
  currentUserId: string;
  isBookmarked: boolean;
  onToggleBookmark: (storyId: string) => void;
}) {
  const isLiked = story.likes.includes(currentUserId);
  const [likeLoading, setLikeLoading] = useState(false);
  const timeAgo = story.createdAt
    ? formatTimeAgo(
        story.createdAt instanceof Date
          ? story.createdAt
          : typeof (story.createdAt as any).toDate === 'function'
          ? (story.createdAt as any).toDate()
          : new Date(story.createdAt as any)
      )
    : '';
  const preview = story.content.length > 200 ? story.content.substring(0, 200) + '...' : story.content;
  const [expanded, setExpanded] = useState(false);

  const handleLike = async () => {
    if (likeLoading || !currentUserId) return;
    setLikeLoading(true);
    try {
      if (isLiked) {
        await unlikePost({ postId: story.id });
      } else {
        await likePost({ postId: story.id });
      }
    } catch (err) {
      console.error('Like/unlike failed:', err);
    } finally {
      setLikeLoading(false);
    }
  };

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

      {/* Story Image */}
      {story.mediaURLs && story.mediaURLs.length > 0 && (
        <div className="px-4 pb-3">
          <img src={story.mediaURLs[0]} alt="" className="w-full rounded-lg object-cover max-h-64" />
        </div>
      )}

      {/* Moderation */}
      {story.moderationStatus === 'pending' && (
        <div className="mx-4 mb-3 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          Awaiting review before visible to others
        </div>
      )}

      {/* Engagement */}
      <div className="flex items-center gap-1 px-4 py-2 border-t border-stone-100">
        <button
          onClick={handleLike}
          disabled={likeLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
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
        <button
          onClick={() => onToggleBookmark(story.id)}
          className={`p-1.5 transition-colors ${
            isBookmarked ? 'text-amber-600' : 'text-stone-400 hover:text-amber-600'
          }`}
        >
          <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}

function StoryComposer({ onSubmit, userId }: { onSubmit: (content: string, isAnonymous: boolean, mediaURLs: string[]) => Promise<void>; userId: string }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [posting, setPosting] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const mediaURLs: string[] = [];
      if (selectedFile) {
        const url = await uploadFile(`stories/${userId}/${Date.now()}_${selectedFile.name}`, selectedFile);
        mediaURLs.push(url);
      }
      await onSubmit(content.trim(), isAnonymous, mediaURLs);
      setContent('');
      removeImage();
      setPosting(false);
      setOpen(false);
    } catch {
      setPosting(false);
    }
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

      {preview && (
        <div className="relative mt-2 inline-block">
          <img src={preview} alt="" className="h-24 rounded-lg object-cover" />
          <button
            onClick={removeImage}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs hover:bg-stone-900"
          >
            ×
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
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
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-stone-400 hover:text-stone-600 bg-stone-100"
          >
            <Image className="h-4 w-4" />
            Photo
          </button>
        </div>
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

  const [tab, setTab] = useState<'all' | 'saved'>('all');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkDocIds, setBookmarkDocIds] = useState<Record<string, string>>({});
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  const { data: stories, loading } = useCollection<Post>(
    'posts',
    where('type', '==', 'story'),
    where('moderationStatus', 'in', ['approved', 'pending']),
    orderBy('createdAt', 'desc')
  );

  // Load bookmarks for current user
  useEffect(() => {
    if (!uid) return;
    setBookmarksLoading(true);

    getDocuments<{ id: string; userId: string; postId: string }>('bookmarks', where('userId', '==', uid))
      .then((docs) => {
        const ids = new Set<string>();
        const docMap: Record<string, string> = {};
        for (const doc of docs) {
          ids.add(doc.postId);
          docMap[doc.postId] = doc.id;
        }
        setBookmarkedIds(ids);
        setBookmarkDocIds(docMap);
      })
      .catch((err) => console.error('Failed to load bookmarks:', err))
      .finally(() => setBookmarksLoading(false));
  }, [uid]);

  const handleToggleBookmark = async (storyId: string) => {
    if (!uid) return;

    if (bookmarkedIds.has(storyId)) {
      // Remove bookmark — optimistic update
      const docId = bookmarkDocIds[storyId];
      if (docId) {
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(storyId);
          return next;
        });
        setBookmarkDocIds((prev) => {
          const next = { ...prev };
          delete next[storyId];
          return next;
        });
        try {
          await deleteDocument('bookmarks', docId);
        } catch (err) {
          console.error('Failed to remove bookmark:', err);
          setBookmarkedIds((prev) => new Set(prev).add(storyId));
          setBookmarkDocIds((prev) => ({ ...prev, [storyId]: docId }));
        }
      }
    } else {
      // Add bookmark — optimistic update
      setBookmarkedIds((prev) => new Set(prev).add(storyId));
      try {
        const newDocId = await addDocument('bookmarks', {
          userId: uid,
          postId: storyId,
        });
        setBookmarkDocIds((prev) => ({ ...prev, [storyId]: newDocId }));
      } catch (err) {
        console.error('Failed to add bookmark:', err);
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(storyId);
          return next;
        });
      }
    }
  };

  const handleNewStory = async (content: string, isAnonymous: boolean, mediaURLs: string[]) => {
    if (!uid) return;
    await addDocument('posts', {
      authorId: uid,
      type: 'story' as const,
      content,
      mediaURLs,
      likes: [],
      commentCount: 0,
      isAnonymous,
      moderationStatus: 'pending',
    });
  };

  const savedStories = stories.filter((s) => bookmarkedIds.has(s.id));
  const displayStories = tab === 'saved' ? savedStories : stories;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-stone-800">Community Stories</h1>
        <p className="text-sm text-stone-500 mt-0.5">Real stories from real people. You are not alone.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
        <button
          onClick={() => setTab('all')}
          className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'all'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          All Stories
        </button>
        <button
          onClick={() => setTab('saved')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'saved'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Bookmark className="h-3.5 w-3.5" />
          Saved{bookmarkedIds.size > 0 ? ` (${bookmarkedIds.size})` : ''}
        </button>
      </div>

      {tab === 'all' && <StoryComposer onSubmit={handleNewStory} userId={uid} />}

      {loading || bookmarksLoading ? (
        <LoadingSkeleton />
      ) : displayStories.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <BookHeart className="h-10 w-10 text-stone-300 mx-auto" />
          <h3 className="font-medium text-stone-800 mt-3">
            {tab === 'saved' ? 'No saved stories' : 'No stories yet'}
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            {tab === 'saved'
              ? 'Bookmark stories to find them here later.'
              : 'Be the first to share your journey. Your story could help someone else feel less alone.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-stone-400">
            {tab === 'saved'
              ? `${savedStories.length} saved ${savedStories.length === 1 ? 'story' : 'stories'}`
              : `${stories.length} stories shared`}
          </p>
          {displayStories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              currentUserId={uid}
              isBookmarked={bookmarkedIds.has(story.id)}
              onToggleBookmark={handleToggleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
}
