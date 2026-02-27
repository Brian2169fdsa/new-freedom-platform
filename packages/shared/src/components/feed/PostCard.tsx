import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Flag, Send } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { formatRelative } from '../../utils/formatDate';
import {
  addDocument,
  subscribeToCollection,
  updateDocument,
  where,
  orderBy,
} from '../../services/firebase/firestore';
import type { Post, Comment } from '../../types';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  authorName?: string;
  authorPhoto?: string;
  onLike?: () => void;
  onReport?: () => void;
  isLiked?: boolean;
}

export function PostCard({
  post,
  currentUserId,
  authorName,
  authorPhoto,
  onLike,
  onReport,
  isLiked,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Subscribe to comments when section is expanded
  useEffect(() => {
    if (!showComments) return;
    setCommentsLoading(true);
    const unsubscribe = subscribeToCollection<Comment>(
      'comments',
      (allComments) => {
        // Filter by postId (demo mode ignores query constraints)
        const filtered = allComments.filter((c) => c.postId === post.id);
        setComments(filtered);
        setCommentsLoading(false);
      },
      where('postId', '==', post.id),
      orderBy('createdAt', 'asc'),
    );
    return unsubscribe;
  }, [showComments, post.id]);

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim() || !currentUserId || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await addDocument('comments', {
        postId: post.id,
        authorId: currentUserId,
        content: commentText.trim(),
        likes: [],
        moderationStatus: 'approved',
      });
      await updateDocument('posts', post.id, {
        commentCount: (post.commentCount ?? 0) + 1,
      });
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentText, currentUserId, commentSubmitting, post.id, post.commentCount]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar
            src={post.isAnonymous ? null : authorPhoto}
            alt={post.isAnonymous ? 'Anonymous' : authorName}
            fallback={post.isAnonymous ? 'A' : undefined}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-stone-800 text-sm">
                {post.isAnonymous ? 'Anonymous' : authorName || 'Member'}
              </span>
              <span className="text-xs text-stone-400">{formatRelative(post.createdAt)}</span>
              {post.type !== 'text' && (
                <Badge variant="secondary">{post.type}</Badge>
              )}
            </div>
            <p className="mt-2 text-stone-700 text-sm whitespace-pre-wrap">{post.content}</p>
            {post.mediaURLs && post.mediaURLs.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {post.mediaURLs.map((url, i) => (
                  <img key={i} src={url} alt="" className="rounded-lg object-cover w-full h-40" />
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={onLike}
                className={`flex items-center gap-1 text-xs ${
                  isLiked ? 'text-red-500' : 'text-stone-400 hover:text-red-500'
                }`}
              >
                <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
                {post.likes.length > 0 && post.likes.length}
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-1 text-xs ${
                  showComments ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                {post.commentCount > 0 && post.commentCount}
              </button>
              <button
                onClick={onReport}
                className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 ml-auto"
              >
                <Flag className="h-3 w-3" />
              </button>
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="mt-3 pt-3 border-t border-stone-100 space-y-3">
                {commentsLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-8 bg-stone-100 rounded-lg" />
                    <div className="h-8 bg-stone-100 rounded-lg w-3/4" />
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <div className="h-6 w-6 shrink-0 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-medium text-stone-500">
                          {comment.authorId.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-stone-50 rounded-lg px-2.5 py-1.5">
                            <p className="text-xs text-stone-700">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 text-center py-1">
                    No comments yet
                  </p>
                )}

                {currentUserId && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      placeholder="Write a comment..."
                      className="flex-1 px-2.5 py-1.5 bg-stone-50 rounded-lg text-xs border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      disabled={commentSubmitting}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || commentSubmitting}
                      className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
