import React from 'react';
import { Heart, MessageCircle, Flag } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { formatRelative } from '../../utils/formatDate';
import type { Post } from '../../types';

interface PostCardProps {
  post: Post;
  authorName?: string;
  authorPhoto?: string;
  onLike?: () => void;
  onComment?: () => void;
  onReport?: () => void;
  isLiked?: boolean;
}

export function PostCard({
  post,
  authorName,
  authorPhoto,
  onLike,
  onComment,
  onReport,
  isLiked,
}: PostCardProps) {
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
              <span className="font-medium text-slate-800 text-sm">
                {post.isAnonymous ? 'Anonymous' : authorName || 'Member'}
              </span>
              <span className="text-xs text-slate-400">{formatRelative(post.createdAt)}</span>
              {post.type !== 'text' && (
                <Badge variant="secondary">{post.type}</Badge>
              )}
            </div>
            <p className="mt-2 text-slate-700 text-sm whitespace-pre-wrap">{post.content}</p>
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
                  isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                }`}
              >
                <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
                {post.likes.length > 0 && post.likes.length}
              </button>
              <button
                onClick={onComment}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
              >
                <MessageCircle className="h-4 w-4" />
                {post.commentCount > 0 && post.commentCount}
              </button>
              <button
                onClick={onReport}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 ml-auto"
              >
                <Flag className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
