import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, useCollection, type Post, type Comment } from '@reprieve/shared';
import { where, orderBy, collection, addDoc, onSnapshot, query, serverTimestamp, increment, doc, updateDoc } from 'firebase/firestore';
import { db } from '@reprieve/shared/services/firebase/config';
import { addDocument } from '@reprieve/shared/services/firebase/firestore';
import { likePost, unlikePost, reportPost } from '@reprieve/shared/services/firebase/functions';
import { uploadFile } from '@reprieve/shared/services/firebase/storage';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Eye, EyeOff, Image, Flag, Check, Copy } from 'lucide-react';

const MOOD_EMOJI: Record<string, string> = {
  great: '😊', good: '🙂', okay: '😐', struggling: '😔', crisis: '😢',
};

async function shareContent(title: string, text: string) {
  const shareData = { title, text, url: window.location.href };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch {
      return 'cancelled';
    }
  } else {
    try {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      return 'copied';
    } catch {
      return 'error';
    }
  }
}

function PostCard({ post, currentUserId }: { post: Post; currentUserId: string }) {
  const [showComments, setShowComments] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

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

  // Subscribe to comments subcollection when comments section is open
  useEffect(() => {
    if (!showComments) return;
    setCommentsLoading(true);
    const commentsRef = collection(db, 'posts', post.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as Comment));
        setComments(loaded);
        setCommentsLoading(false);
      },
      (err) => {
        console.error('Failed to load comments:', err);
        setCommentsLoading(false);
      }
    );
    return unsubscribe;
  }, [showComments, post.id]);

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

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUserId || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      await addDoc(commentsRef, {
        postId: post.id,
        authorId: currentUserId,
        content: commentText.trim(),
        likes: [],
        moderationStatus: 'approved',
        createdAt: serverTimestamp(),
      });
      // Increment commentCount on the post document
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, { commentCount: increment(1) });
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleShare = async () => {
    const preview = post.content.length > 100 ? post.content.slice(0, 100) + '...' : post.content;
    const result = await shareContent('Community Post', preview);
    if (result === 'copied') {
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            showComments ? 'text-amber-600 bg-amber-50' : 'text-stone-500 hover:bg-stone-100'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          {post.commentCount > 0 && <span>{post.commentCount}</span>}
        </button>
        <button
          onClick={handleShare}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            shareStatus === 'copied' ? 'text-green-600 bg-green-50' : 'text-stone-500 hover:bg-stone-100'
          }`}
        >
          {shareStatus === 'copied' ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          {shareStatus === 'copied' && <span className="text-xs">Copied</span>}
        </button>
        <div className="flex-1" />
        <button onClick={handleReport} className="text-stone-400 hover:text-stone-600 p-1.5">
          <Flag className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <div className="border-t border-stone-100 p-4 space-y-3">
          {/* Existing Comments */}
          {commentsLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 bg-stone-100 rounded-lg" />
              <div className="h-8 bg-stone-100 rounded-lg w-3/4" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => {
                const commentTime = comment.createdAt
                  ? formatTimeAgo(
                      typeof (comment.createdAt as any).toDate === 'function'
                        ? (comment.createdAt as any).toDate()
                        : new Date(comment.createdAt as any)
                    )
                  : '';
                return (
                  <div key={comment.id} className="flex gap-2.5">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-medium text-stone-600">
                      {comment.authorId.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-stone-50 rounded-lg px-3 py-2">
                        <p className="text-xs font-medium text-stone-600">Community Member</p>
                        <p className="text-sm text-stone-700 mt-0.5">{comment.content}</p>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1 px-1">{commentTime}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-stone-400 text-center py-2">
              No comments yet. Be the first to respond!
            </p>
          )}

          {/* Comment Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
              placeholder="Write a supportive comment..."
              className="flex-1 px-3 py-2 bg-stone-50 rounded-lg text-sm border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
              disabled={commentSubmitting}
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || commentSubmitting}
              className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PostComposerFull({ onPost, userId }: { onPost: (content: string, isAnonymous: boolean, mediaURLs: string[]) => Promise<void>; userId: string }) {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    setSelectedFiles(prev => [...prev, ...imageFiles].slice(0, 4));
    setPreviews(prev => [...prev, ...imageFiles.map(f => URL.createObjectURL(f))].slice(0, 4));
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedFiles.length === 0) return;
    setPosting(true);
    try {
      const mediaURLs: string[] = [];
      for (const file of selectedFiles) {
        const url = await uploadFile(`posts/${userId}/${Date.now()}_${file.name}`, file);
        mediaURLs.push(url);
      }
      await onPost(content.trim(), isAnonymous, mediaURLs);
      setContent('');
      previews.forEach(u => URL.revokeObjectURL(u));
      setSelectedFiles([]);
      setPreviews([]);
    } finally {
      setPosting(false);
    }
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

      {previews.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {previews.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt="" className="h-20 w-20 object-cover rounded-lg" />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs hover:bg-stone-900"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-xs"
          >
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
          disabled={(!content.trim() && selectedFiles.length === 0) || posting}
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

  const handleNewPost = async (content: string, isAnonymous: boolean, mediaURLs: string[]) => {
    if (!uid) return;
    await addDocument('posts', {
      authorId: uid,
      type: 'text' as const,
      content,
      mediaURLs,
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

      <PostComposerFull onPost={handleNewPost} userId={uid} />

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
