import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  Button,
  Input,
  Avatar,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from '@reprieve/shared';
import type { Message, Conversation } from '@reprieve/shared';
import { useAuth } from '@reprieve/shared/hooks/useAuth';
import { db } from '@reprieve/shared/services/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  limit,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  Send,
  MessageSquare,
  ArrowLeft,
  Search,
  Paperclip,
  Plus,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  const date = ts.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMessageTime(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  const date = ts.toDate();
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '...';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ConversationCardProps {
  conversation: Conversation;
  currentUserId: string;
  onSelect: (conv: Conversation) => void;
}

function ConversationCard({ conversation, currentUserId, onSelect }: ConversationCardProps) {
  const unread = conversation.unreadCount?.[currentUserId] ?? 0;
  const displayName =
    conversation.title ||
    conversation.participants.filter((p) => p !== currentUserId).join(', ') ||
    'Conversation';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <button
      onClick={() => onSelect(conversation)}
      className="w-full text-left focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl"
    >
      <Card className="hover:bg-stone-50 transition-colors cursor-pointer">
        <CardContent className="p-4 flex items-center gap-3">
          <Avatar fallback={initials} size="md" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-stone-800 truncate">{displayName}</p>
              <span className="text-xs text-stone-400 whitespace-nowrap ml-2">
                {formatTimestamp(conversation.lastMessageAt)}
              </span>
            </div>
            <p className="text-xs text-stone-500 truncate mt-0.5">
              {truncate(conversation.lastMessage || '', 60)}
            </p>
          </div>

          {unread > 0 && (
            <span className="flex-shrink-0 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-amber-600 text-white text-[10px] font-bold">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </CardContent>
      </Card>
    </button>
  );
}

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
}

function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const hasAttachment = !!(message as any).attachmentURL;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? 'bg-amber-600 text-white rounded-br-md'
            : 'bg-stone-200 text-stone-800 rounded-bl-md'
        }`}
      >
        {hasAttachment && (
          <a
            href={(message as any).attachmentURL}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 text-xs mb-1.5 underline ${
              isOwn ? 'text-amber-200' : 'text-amber-700'
            }`}
          >
            <Paperclip className="h-3 w-3" />
            {(message as any).attachmentName || 'Attachment'}
          </a>
        )}
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
        <p
          className={`text-[10px] mt-1 ${
            isOwn ? 'text-amber-200' : 'text-stone-400'
          } text-right`}
        >
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New Message Dialog (User Picker)
// ---------------------------------------------------------------------------

interface ContactUser {
  id: string;
  displayName: string;
  role?: string;
}

function NewMessageDialog({
  open,
  onOpenChange,
  currentUserId,
  onStartConversation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  onStartConversation: (userId: string, userName: string) => void;
}) {
  const [contacts, setContacts] = useState<ContactUser[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  useEffect(() => {
    if (!open || !currentUserId) return;

    setLoadingContacts(true);
    const q = query(
      collection(db, 'users'),
      where('lanes', 'array-contains', 'lane1'),
      limit(50),
    );

    getDocs(q)
      .then((snapshot) => {
        const users: ContactUser[] = snapshot.docs
          .filter((d) => d.id !== currentUserId)
          .map((d) => ({
            id: d.id,
            displayName: (d.data() as any).displayName || 'Unknown',
            role: (d.data() as any).role,
          }));
        setContacts(users);
      })
      .catch((err) => {
        console.error('Failed to load contacts:', err);
      })
      .finally(() => setLoadingContacts(false));
  }, [open, currentUserId]);

  const filtered = contacts.filter((c) => {
    if (!contactSearch.trim()) return true;
    return c.displayName.toLowerCase().includes(contactSearch.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>New Message</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search people..."
              className="pl-10"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {loadingContacts ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-6">
                {contactSearch ? 'No matches found' : 'No contacts available'}
              </p>
            ) : (
              filtered.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    onStartConversation(contact.id, contact.displayName);
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-50 transition-colors text-left"
                >
                  <Avatar fallback={contact.displayName.charAt(0).toUpperCase()} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">
                      {contact.displayName}
                    </p>
                    {contact.role && (
                      <p className="text-xs text-stone-400 capitalize">{contact.role}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Messages() {
  const { firebaseUser } = useAuth();
  const currentUserId = firebaseUser?.uid ?? '';

  // View state
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);

  // Data state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Message input
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- real-time conversation list ----
  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUserId),
      orderBy('lastMessageAt', 'desc'),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const convos: Conversation[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Conversation[];
        setConversations(convos);
        setLoadingConversations(false);
      },
      (error) => {
        console.error('Error listening to conversations:', error);
        setLoadingConversations(false);
      },
    );

    return () => unsubscribe();
  }, [currentUserId]);

  // ---- real-time messages for selected conversation ----
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', activeConversation.id),
      orderBy('createdAt', 'asc'),
      limit(200),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Message[];
        setMessages(msgs);
        setLoadingMessages(false);
      },
      (error) => {
        console.error('Error listening to messages:', error);
        setLoadingMessages(false);
      },
    );

    return () => unsubscribe();
  }, [activeConversation?.id]);

  // ---- mark as read when opening a conversation ----
  const markAsRead = useCallback(
    async (conv: Conversation) => {
      if (!currentUserId || !conv.id) return;
      const unread = conv.unreadCount?.[currentUserId] ?? 0;
      if (unread === 0) return;

      try {
        const convRef = doc(db, 'conversations', conv.id);
        await updateDoc(convRef, {
          [`unreadCount.${currentUserId}`]: 0,
        });
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    },
    [currentUserId],
  );

  const handleSelectConversation = useCallback(
    (conv: Conversation) => {
      setActiveConversation(conv);
      markAsRead(conv);
    },
    [markAsRead],
  );

  // ---- auto-scroll to bottom on new messages ----
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ---- focus input when entering chat view ----
  useEffect(() => {
    if (activeConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeConversation]);

  // ---- send message ----
  async function handleSend() {
    const trimmed = newMessage.trim();
    if (!trimmed || !activeConversation || !currentUserId || sending) return;

    setSending(true);
    setNewMessage('');

    try {
      await addDoc(collection(db, 'messages'), {
        conversationId: activeConversation.id,
        senderId: currentUserId,
        content: trimmed,
        type: 'text' as const,
        readBy: [currentUserId],
        createdAt: serverTimestamp(),
      });

      const convRef = doc(db, 'conversations', activeConversation.id);
      await updateDoc(convRef, {
        lastMessage: trimmed,
        lastMessageAt: serverTimestamp(),
        [`unreadCount.${currentUserId}`]: 0,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(trimmed);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ---- file attachment handler (placeholder for Firebase Storage integration) ----
  function handleFileSelect() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeConversation || !currentUserId) return;

    // TODO: Upload file to Firebase Storage, get URL, then send as message
    console.log('File selected for upload:', file.name);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  // ---- start new conversation ----
  async function handleStartConversation(targetUserId: string, targetName: string) {
    if (!currentUserId) return;

    // Check if conversation already exists between these two users
    const existing = conversations.find(
      (c) =>
        c.participants.includes(targetUserId) &&
        c.participants.includes(currentUserId) &&
        c.participants.length === 2,
    );

    if (existing) {
      handleSelectConversation(existing);
      return;
    }

    try {
      const convDoc = await addDoc(collection(db, 'conversations'), {
        participants: [currentUserId, targetUserId],
        title: targetName,
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        unreadCount: { [currentUserId]: 0, [targetUserId]: 0 },
        createdAt: serverTimestamp(),
      });

      const newConv: Conversation = {
        id: convDoc.id,
        participants: [currentUserId, targetUserId],
        title: targetName,
        lastMessage: '',
        lastMessageAt: null as any,
        unreadCount: { [currentUserId]: 0, [targetUserId]: 0 },
      } as Conversation;

      setActiveConversation(newConv);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  }

  // ---- filtered conversations ----
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = (conv.title || '').toLowerCase();
    const participantMatch = conv.participants.some((p) => p.toLowerCase().includes(q));
    const lastMsg = (conv.lastMessage || '').toLowerCase();
    return title.includes(q) || participantMatch || lastMsg.includes(q);
  });

  // ---- derive display name for active conversation header ----
  const activeConvName = activeConversation
    ? activeConversation.title ||
      activeConversation.participants.filter((p) => p !== currentUserId).join(', ') ||
      'Conversation'
    : '';

  // ================================================
  // CHAT VIEW
  // ================================================
  if (activeConversation) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-200 bg-stone-50 flex-shrink-0">
          <button
            onClick={() => setActiveConversation(null)}
            className="p-1.5 rounded-lg hover:bg-stone-200 transition-colors text-stone-600"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Avatar fallback={activeConvName.charAt(0).toUpperCase()} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-800 truncate">{activeConvName}</p>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
                <p className="text-sm text-stone-400">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-10 w-10 text-stone-300 mx-auto mb-3" />
                <p className="text-sm text-stone-400">No messages yet. Say hello!</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUserId} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-stone-200 bg-stone-50 flex-shrink-0">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
          />
          <button
            onClick={handleFileSelect}
            className="flex-shrink-0 p-2 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ================================================
  // CONVERSATION LIST VIEW
  // ================================================
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Messages</h2>
          <p className="text-sm text-stone-500 mt-1">Stay connected with your support team</p>
        </div>
        <Button
          size="sm"
          onClick={() => setNewMessageDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          className="pl-10"
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-20">
        {loadingConversations ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
              <p className="text-sm text-stone-400">Loading conversations...</p>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center px-6">
              <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-stone-300" />
              </div>
              {searchQuery.trim() ? (
                <>
                  <p className="text-base font-medium text-stone-600">No results found</p>
                  <p className="text-sm text-stone-400 mt-1">
                    Try a different search term
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-medium text-stone-600">No conversations yet</p>
                  <p className="text-sm text-stone-400 mt-1">
                    Your case manager will reach out soon, or start a new message.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setNewMessageDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Start a Conversation
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conversation={conv}
              currentUserId={currentUserId}
              onSelect={handleSelectConversation}
            />
          ))
        )}
      </div>

      {/* Floating action button: New Message */}
      {filteredConversations.length > 0 && (
        <div className="fixed bottom-24 right-6 z-10">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow !p-0"
            aria-label="New message"
            onClick={() => setNewMessageDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* New Message Dialog */}
      <NewMessageDialog
        open={newMessageDialogOpen}
        onOpenChange={setNewMessageDialogOpen}
        currentUserId={currentUserId}
        onStartConversation={handleStartConversation}
      />
    </div>
  );
}
