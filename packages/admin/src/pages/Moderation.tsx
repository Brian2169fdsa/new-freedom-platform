import { useState, useMemo, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Avatar, Button,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter,
  useCollection,
  formatRelative, cn,
} from '@reprieve/shared';
import type { Post, User, ModerationStatus } from '@reprieve/shared';
import {
  Shield, CheckCircle, Flag, Trash2, AlertTriangle,
  MessageSquare, Ban, Eye, BarChart3,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODERATION_TABS: { value: ModerationStatus; label: string; icon: React.ElementType }[] = [
  { value: 'pending', label: 'Pending Review', icon: Eye },
  { value: 'flagged', label: 'Flagged', icon: Flag },
  { value: 'approved', label: 'Approved', icon: CheckCircle },
  { value: 'removed', label: 'Removed', icon: Trash2 },
];

const STATUS_COLORS: Record<ModerationStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800' },
  flagged: { bg: 'bg-orange-100', text: 'text-orange-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  removed: { bg: 'bg-red-100', text: 'text-red-800' },
};

// ---------------------------------------------------------------------------
// Toxicity Score Bar
// ---------------------------------------------------------------------------

function ToxicityBar({ score }: { readonly score: number }) {
  const percentage = Math.round(score * 100);
  const color = score >= 0.7 ? 'bg-red-500' : score >= 0.4 ? 'bg-orange-500' : 'bg-green-500';
  const label = score >= 0.7 ? 'High' : score >= 0.4 ? 'Medium' : 'Low';

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-stone-500">{percentage}% ({label})</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Moderation Queue Card
// ---------------------------------------------------------------------------

interface QueueCardProps {
  readonly post: Post;
  readonly author: User | undefined;
  readonly onAction: (postId: string, action: string) => void;
}

function QueueCard({ post, author, onAction }: QueueCardProps) {
  const authorName = post.isAnonymous
    ? 'Anonymous'
    : author?.displayName ?? 'Unknown User';

  return (
    <Card className="hover:border-stone-300 transition-colors">
      <CardContent className="p-5">
        <div className="space-y-3">
          {/* Author + Timestamp */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar
                src={post.isAnonymous ? undefined : author?.photoURL}
                alt={authorName}
                size="sm"
              />
              <div>
                <p className="text-sm font-medium text-stone-700">{authorName}</p>
                <p className="text-xs text-stone-400">{formatRelative(post.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {post.toxicityScore != null && (
                <ToxicityBar score={post.toxicityScore} />
              )}
              <Badge variant={post.type === 'milestone' ? 'success' : 'secondary'}>
                {post.type}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <p className="text-sm text-stone-700 line-clamp-3">{post.content}</p>

          {/* Media preview */}
          {post.mediaURLs && post.mediaURLs.length > 0 && (
            <div className="flex gap-2">
              {post.mediaURLs.slice(0, 3).map((url, i) => (
                <div key={i} className="h-16 w-16 rounded-lg bg-stone-100 overflow-hidden">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-stone-500">
            <span>{post.likes.length} likes</span>
            <span>{post.commentCount} comments</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            {post.moderationStatus === 'pending' || post.moderationStatus === 'flagged' ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(post.id, 'approve')}
                  className="text-green-700 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(post.id, 'flag')}
                  className="text-orange-700 border-orange-200 hover:bg-orange-50"
                >
                  <Flag className="h-3.5 w-3.5 mr-1" />
                  Flag
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(post.id, 'remove')}
                  className="text-red-700 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Remove
                </Button>
                <div className="flex-1" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAction(post.id, 'warn')}
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Warn User
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAction(post.id, 'suspend')}
                  className="text-red-600"
                >
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  Suspend
                </Button>
              </>
            ) : (
              <span className="text-xs text-stone-400">
                {post.moderationStatus === 'approved' ? 'Approved' : 'Removed'} by moderator
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Confirm Action Dialog
// ---------------------------------------------------------------------------

interface ConfirmActionProps {
  readonly open: boolean;
  readonly action: string;
  readonly postId: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

function ConfirmActionDialog({ open, action, postId, onConfirm, onCancel }: ConfirmActionProps) {
  const isDestructive = ['remove', 'suspend'].includes(action);
  const descriptions: Record<string, string> = {
    approve: 'This post will be visible to all community members.',
    flag: 'This post will be marked for further review.',
    remove: 'This post will be permanently removed from the community.',
    warn: 'The author will receive a warning notification.',
    suspend: 'The author will be temporarily suspended from posting.',
  };

  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogHeader>
        <DialogTitle>
          Confirm: {action.charAt(0).toUpperCase() + action.slice(1)}
        </DialogTitle>
      </DialogHeader>
      <DialogContent>
        <p className="text-sm text-stone-600">
          {descriptions[action] ?? 'Are you sure you want to perform this action?'}
        </p>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          variant={isDestructive ? 'destructive' : 'default'}
          onClick={onConfirm}
        >
          {action.charAt(0).toUpperCase() + action.slice(1)}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Auto-Moderation Stats
// ---------------------------------------------------------------------------

function AutoModStats({ posts }: { readonly posts: readonly Post[] }) {
  const withScore = posts.filter((p) => p.toxicityScore != null);
  const high = withScore.filter((p) => (p.toxicityScore ?? 0) >= 0.7).length;
  const medium = withScore.filter((p) => {
    const s = p.toxicityScore ?? 0;
    return s >= 0.4 && s < 0.7;
  }).length;
  const low = withScore.filter((p) => (p.toxicityScore ?? 0) < 0.4).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-stone-400" />
          Auto-Moderation Stats
        </CardTitle>
        <CardDescription>Perspective API toxicity analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{high}</p>
            <p className="text-xs text-stone-500">High Toxicity</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{medium}</p>
            <p className="text-xs text-stone-500">Medium</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{low}</p>
            <p className="text-xs text-stone-500">Low</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-stone-400">
            {withScore.length} of {posts.length} posts analyzed
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function Moderation() {
  const { data: posts, loading: postsLoading } = useCollection<Post>('posts');
  const { data: users } = useCollection<User>('users');

  const [activeTab, setActiveTab] = useState<ModerationStatus>('pending');
  const [confirmAction, setConfirmAction] = useState<{
    postId: string;
    action: string;
  } | null>(null);

  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.uid, u));
    return map;
  }, [users]);

  const filteredPosts = useMemo(
    () => posts.filter((p) => p.moderationStatus === activeTab),
    [posts, activeTab],
  );

  const tabCounts = useMemo(() => {
    const counts: Record<ModerationStatus, number> = {
      pending: 0,
      flagged: 0,
      approved: 0,
      removed: 0,
    };
    posts.forEach((p) => {
      counts[p.moderationStatus]++;
    });
    return counts;
  }, [posts]);

  const handleAction = useCallback((postId: string, action: string) => {
    setConfirmAction({ postId, action });
  }, []);

  const executeAction = useCallback(() => {
    if (!confirmAction) return;
    // In production, this would call updateDocument to change the post's moderationStatus
    // and potentially create a notification for the user
    setConfirmAction(null);
  }, [confirmAction]);

  if (postsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-52 bg-stone-200 rounded animate-pulse" />
        <div className="h-12 w-96 bg-stone-100 rounded animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-stone-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Content Moderation</h1>
        <p className="text-sm text-stone-500">
          Review and manage community content across all lanes
        </p>
      </div>

      {/* Auto-Moderation Stats */}
      <AutoModStats posts={posts} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ModerationStatus)}>
        <TabsList className="w-full justify-start">
          {MODERATION_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tabCounts[tab.value] > 0 && (
                <span className={cn(
                  'ml-1 text-xs rounded-full px-1.5 py-0.5',
                  tab.value === 'pending' && tabCounts[tab.value] > 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-stone-200 text-stone-600',
                )}>
                  {tabCounts[tab.value]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {MODERATION_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Shield className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500">No {tab.label.toLowerCase()} content.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <QueueCard
                    key={post.id}
                    post={post}
                    author={userMap.get(post.authorId)}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Appeal Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Appeal Requests</CardTitle>
          <CardDescription>Members who have appealed content removal decisions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-400 text-center py-6">
            No pending appeal requests.
          </p>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <ConfirmActionDialog
          open
          action={confirmAction.action}
          postId={confirmAction.postId}
          onConfirm={executeAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
