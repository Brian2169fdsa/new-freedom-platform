import { useState, useCallback } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  Badge,
  Button,
  Textarea,
  Input,
  Avatar,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  useAuth,
  useCollection,
  formatRelative,
} from '@reprieve/shared';
import { where, orderBy } from 'firebase/firestore';
import { setDocument } from '@reprieve/shared/services/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import {
  Plus,
  MessageCircle,
  Pin,
  Shield,
  ArrowLeft,
  Send,
  Users,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface Thread {
  id: string;
  stepNumber: number;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorRole?: string;
  replyCount: number;
  lastActivityAt: Timestamp;
  isPinned: boolean;
  createdAt: Timestamp;
}

interface Reply {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorRole?: string;
  createdAt: Timestamp;
}

const STEP_LABELS = [
  'Step 1: Honesty',
  'Step 2: Hope',
  'Step 3: Faith',
  'Step 4: Courage',
  'Step 5: Integrity',
  'Step 6: Willingness',
  'Step 7: Humility',
  'Step 8: Brotherly Love',
  'Step 9: Justice',
  'Step 10: Perseverance',
  'Step 11: Spiritual Awareness',
  'Step 12: Service',
];

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 bg-stone-100 rounded-lg" />
      <div className="h-24 bg-stone-100 rounded-xl" />
      <div className="h-24 bg-stone-100 rounded-xl" />
      <div className="h-24 bg-stone-100 rounded-xl" />
    </div>
  );
}

function EmptyState({ stepNumber }: { stepNumber: number }) {
  return (
    <div className="text-center py-8">
      <Users className="h-10 w-10 text-stone-300 mx-auto mb-2" />
      <p className="text-stone-500">No discussions yet for Step {stepNumber}.</p>
      <p className="text-sm text-stone-400 mt-1">Be the first to start a conversation!</p>
    </div>
  );
}

function isStaffRole(role: string | undefined): boolean {
  return role === 'admin' || role === 'super_admin' || role === 'mentor';
}

export default function Community() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const currentStep = user?.stepExperience?.currentStep ?? 1;

  const [selectedStep, setSelectedStep] = useState(String(currentStep));
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadSubmitting, setNewThreadSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const stepNum = parseInt(selectedStep, 10);

  // Fetch threads for selected step
  const { data: threads, loading: threadsLoading } = useCollection<Thread>(
    'community_threads',
    where('stepNumber', '==', stepNum),
    orderBy('isPinned', 'desc'),
    orderBy('lastActivityAt', 'desc')
  );

  // Fetch replies for active thread
  const { data: replies, loading: repliesLoading } = useCollection<Reply>(
    'community_replies',
    ...(activeThread
      ? [where('threadId', '==', activeThread.id), orderBy('createdAt', 'asc')]
      : [where('threadId', '==', '__none__')])
  );

  const handleCreateThread = useCallback(async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim() || !uid || !user) return;
    setNewThreadSubmitting(true);
    try {
      const docId = `${uid}_${Date.now()}`;
      await setDocument('community_threads', docId, {
        stepNumber: stepNum,
        title: newThreadTitle.trim(),
        content: newThreadContent.trim(),
        authorId: uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || null,
        authorRole: user.role,
        replyCount: 0,
        isPinned: false,
        lastActivityAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      });
      setShowNewThread(false);
      setNewThreadTitle('');
      setNewThreadContent('');
    } catch (err) {
      console.error('Failed to create thread:', err);
    } finally {
      setNewThreadSubmitting(false);
    }
  }, [newThreadTitle, newThreadContent, uid, user, stepNum]);

  const handleReply = useCallback(async () => {
    if (!replyText.trim() || !uid || !user || !activeThread) return;
    setReplySubmitting(true);
    try {
      const docId = `${activeThread.id}_${uid}_${Date.now()}`;
      await setDocument('community_replies', docId, {
        threadId: activeThread.id,
        content: replyText.trim(),
        authorId: uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || null,
        authorRole: user.role,
        createdAt: Timestamp.now(),
      });
      // Update thread reply count and last activity
      await setDocument('community_threads', activeThread.id, {
        ...activeThread,
        replyCount: (activeThread.replyCount ?? 0) + 1,
        lastActivityAt: Timestamp.now(),
      });
      setReplyText('');
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setReplySubmitting(false);
    }
  }, [replyText, uid, user, activeThread]);

  // Thread Detail View
  if (activeThread) {
    return (
      <PageContainer>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setActiveThread(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-stone-400">Step {activeThread.stepNumber} Discussion</p>
            <h3 className="font-semibold text-stone-800 truncate">{activeThread.title}</h3>
          </div>
        </div>

        {/* Original Post */}
        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar
                src={activeThread.authorPhotoURL}
                alt={activeThread.authorName}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-stone-800">
                    {activeThread.authorName}
                  </span>
                  {isStaffRole(activeThread.authorRole) && (
                    <Badge variant="secondary" className="text-[10px] flex items-center gap-0.5">
                      <Shield className="h-2.5 w-2.5" />
                      {activeThread.authorRole === 'mentor' ? 'Mentor' : 'Staff'}
                    </Badge>
                  )}
                  {activeThread.isPinned && (
                    <Badge variant="warning" className="text-[10px] flex items-center gap-0.5">
                      <Pin className="h-2.5 w-2.5" /> Pinned
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {formatRelative(activeThread.createdAt)}
                </p>
                <p className="text-sm text-stone-700 mt-3 whitespace-pre-wrap">
                  {activeThread.content}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-2 mt-4">
          <p className="text-sm font-medium text-stone-600">
            {replies?.length ?? 0} {(replies?.length ?? 0) === 1 ? 'Reply' : 'Replies'}
          </p>
          {repliesLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-16 bg-stone-100 rounded-lg" />
              <div className="h-16 bg-stone-100 rounded-lg" />
            </div>
          ) : replies && replies.length > 0 ? (
            replies.map((reply) => (
              <Card key={reply.id}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={reply.authorPhotoURL}
                      alt={reply.authorName}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-stone-800">
                          {reply.authorName}
                        </span>
                        {isStaffRole(reply.authorRole) && (
                          <Badge variant="secondary" className="text-[10px] flex items-center gap-0.5">
                            <Shield className="h-2.5 w-2.5" />
                            {reply.authorRole === 'mentor' ? 'Mentor' : 'Staff'}
                          </Badge>
                        )}
                        <span className="text-xs text-stone-400">
                          {formatRelative(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-stone-700 mt-1 whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-stone-400 text-center py-4">
              No replies yet. Be the first to respond!
            </p>
          )}
        </div>

        {/* Reply Composer */}
        <Card className="mt-4 sticky bottom-16 md:bottom-0">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="flex-1 resize-none min-h-[44px]"
              />
              <Button
                onClick={handleReply}
                disabled={!replyText.trim() || replySubmitting}
                size="icon"
                className="shrink-0 self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // Thread List View
  return (
    <PageContainer
      title="Community"
      subtitle="Connect with others on the same journey"
      action={
        <Button size="sm" onClick={() => setShowNewThread(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Thread
        </Button>
      }
    >
      {/* Step Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <Tabs value={selectedStep} onValueChange={setSelectedStep}>
          <TabsList className="inline-flex w-auto gap-1 bg-transparent p-0">
            {STEP_LABELS.map((_, i) => {
              const stepN = i + 1;
              const isAccessible = stepN <= currentStep;
              return (
                <TabsTrigger
                  key={stepN}
                  value={String(stepN)}
                  disabled={!isAccessible}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedStep === String(stepN)
                      ? 'bg-amber-700 text-white shadow-sm'
                      : isAccessible
                        ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        : 'bg-stone-50 text-stone-300 cursor-not-allowed'
                  }`}
                >
                  {stepN}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      <p className="text-sm text-stone-500 font-medium">{STEP_LABELS[stepNum - 1]}</p>

      {/* Thread List */}
      {threadsLoading ? (
        <LoadingSkeleton />
      ) : threads && threads.length > 0 ? (
        <div className="space-y-2">
          {threads.map((thread) => (
            <Card
              key={thread.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <button
                  onClick={() => setActiveThread(thread)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={thread.authorPhotoURL}
                      alt={thread.authorName}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {thread.isPinned && (
                          <Pin className="h-3 w-3 text-amber-600" />
                        )}
                        <h4 className="font-medium text-sm text-stone-800 truncate">
                          {thread.title}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                        {thread.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                        <span>{thread.authorName}</span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {thread.replyCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelative(thread.lastActivityAt)}
                        </span>
                        {isStaffRole(thread.authorRole) && (
                          <Badge variant="secondary" className="text-[10px]">
                            <Shield className="h-2.5 w-2.5 mr-0.5" />
                            Staff
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-300 shrink-0 mt-1" />
                  </div>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState stepNumber={stepNum} />
      )}

      {/* New Thread Dialog */}
      <Dialog open={showNewThread} onOpenChange={setShowNewThread}>
        <DialogHeader>
          <DialogTitle>New Discussion - Step {stepNum}</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          <Input
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
            placeholder="Thread title..."
            maxLength={120}
          />
          <Textarea
            value={newThreadContent}
            onChange={(e) => setNewThreadContent(e.target.value)}
            placeholder="Share your thoughts, questions, or experiences..."
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-stone-400">
            Be respectful and supportive. This is a safe space for recovery.
          </p>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewThread(false)} size="sm">
            Cancel
          </Button>
          <Button
            onClick={handleCreateThread}
            disabled={!newThreadTitle.trim() || !newThreadContent.trim() || newThreadSubmitting}
            size="sm"
          >
            {newThreadSubmitting ? 'Posting...' : 'Post Thread'}
          </Button>
        </DialogFooter>
      </Dialog>
    </PageContainer>
  );
}
