import React, { useState } from 'react';
import { useAuth, useCollection, type Post, type User } from '@reprieve/shared';
import { where, orderBy } from 'firebase/firestore';
import { addDocument } from '@reprieve/shared/services/firebase/firestore';
import { likePost, unlikePost, reportPost } from '@reprieve/shared/services/firebase/functions';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Eye, EyeOff, Image, Flag } from 'lucide-react';

const MOOD_EMOJI: Record<string, string> = {
  great: '😊', good: '🙂', okay: '😐', struggling: '😔', crisis: '😢',
};

function PostCard({ post, currentUserId }: { post: Post; currentUserId: string }) {
  const [showComments, setShowComments] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const isLiked = post.likes.includes(currentUserId);
  const timeAgo = post.createdAt
    ? formatTimeAgo(
        post.createdAt instanceof Date
          ? post.createdAt
          : typeof (post.createdAt as any).toDate === 'function'
          ? (post.createdAt as any).toDate()
          : new Date(post.createdAt as any)
      )
    : '';

  const handleLike = async () => {
    if (likeLoading || !currentUserId) return;
    setLikeLoading(true);
    try {
      if (isLiked) {
        await unlikePost({ postId: post.id });
      } else {
        await likePost({ postId: post.id });
      }
    } catch (err) {
      console.error('Like/unlike failed:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleReport = async () => {
    if (!currentUserId) return;
    try {
      await reportPost({ postId: post.id, reason: 'inappropriate' });
    } catch (err) {
      console.error('Report failed:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-medium text-amber-800">
          {post.isAnonymous ? '🙈' : (post.authorId?.substring(0, 2).toUpperCase() || '??')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-stone-800 text-sm">
            {post.isAnonymous ? 'Anonymous' : 'Community Member'}
          </p>
          <p className="text-xs text-stone-400">{timeAgo}</p>
        </div>
        {post.type === 'milestone' && (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
            🏆 Milestone
          </span>
        )}
        <button className="text-stone-400 hover:text-stone-600">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-stone-700 text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>

      {/* Media */}
      {post.mediaURLs && post.mediaURLs.length > 0 && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
            {post.mediaURLs.map((url, i) => (
              <img key={i} src={url} alt="" className="w-full h-40 object-cover" />
            ))}
          </div>
        </div>
      )}

      {/* Moderation Badge */}
      {post.moderationStatus === 'pending' && (
        <div className="mx-4 mb-3 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          ⏳ This post is awaiting review
        </div>
      )}

      {/* Engagement Bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-t border-stone-100">
        <button
          onClick={handleLike}
          disabled={likeLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          isLiked ? 'text-red-500 bg-red-50' : 'text-stone-500 hover:bg-stone-100'
        }`}>
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          {post.likes.length > 0 && <span>{post.likes.length}</span>}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:bg-stone-100"
        >
          <MessageCircle className="h-4 w-4" />
          {post.commentCount > 0 && <span>{post.commentCount}</span>}
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:bg-stone-100">
          <Share2 className="h-4 w-4" />
        </button>
        <div className="flex-1" />
        <button onClick={handleReport} className="text-stone-400 hover:text-stone-600 p-1.5">
          <Flag className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <div className="border-t border-stone-100 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Write a supportive comment..."
              className="flex-1 px-3 py-2 bg-stone-50 rounded-lg text-sm border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <button className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PostComposerFull({ onPost }: { onPost: (content: string, isAnonymous: boolean) => void }) {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    await onPost(content.trim(), isAnonymous);
    setContent('');
    setPosting(false);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your story, ask for help, or celebrate a win..."
        className="w-full resize-none bg-transparent text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none min-h-[80px]"
        rows={3}
      />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-xs">
            <Image className="h-4 w-4" />
            Photo
          </button>
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors ${
              isAnonymous ? 'bg-amber-100 text-amber-700' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {isAnonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isAnonymous ? 'Anonymous' : 'Public'}
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || posting}
          className="px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {posting ? 'Posting...' : 'Share'}
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-stone-200 p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-stone-200" />
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-stone-200 rounded" />
              <div className="h-2.5 w-16 bg-stone-100 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-stone-200 rounded" />
            <div className="h-3 w-3/4 bg-stone-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

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

export default function Feed() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || '';

  const { data: posts, loading } = useCollection<Post>(
    'posts',
    where('moderationStatus', 'in', ['approved', 'pending']),
    orderBy('createdAt', 'desc')
  );

  const handleNewPost = async (content: string, isAnonymous: boolean) => {
    if (!uid) return;
    await addDocument('posts', {
      authorId: uid,
      type: 'text' as const,
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
        <h1 className="text-xl font-bold text-stone-800">Community Feed</h1>
        <p className="text-sm text-stone-500 mt-0.5">Share, support, and connect</p>
      </div>

      <PostComposerFull onPost={handleNewPost} />

      {loading ? (
        <LoadingSkeleton />
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <span className="text-4xl">🌱</span>
          <h3 className="font-medium text-stone-800 mt-3">Be the first to share</h3>
          <p className="text-sm text-stone-500 mt-1">
            This is a safe space to share your story, ask for help, or celebrate your wins.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={uid} />
          ))}
        </div>
      )}
    </div>
  );
}
