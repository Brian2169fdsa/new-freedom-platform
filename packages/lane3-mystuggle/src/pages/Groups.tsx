import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth, useCollection } from '@reprieve/shared';
import { Timestamp, orderBy } from 'firebase/firestore';
import { addDocument, updateDocument, subscribeToCollection } from '@reprieve/shared/services/firebase/firestore';
import {
  Search, Users, Plus, Lock, Globe, Clock, ChevronDown,
  ChevronRight, Send, X, Shield, MessageSquare, LogOut,
  UserPlus, ArrowLeft, ScrollText, Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GroupCategory =
  | 'Recovery'
  | 'Housing'
  | 'Employment'
  | 'Family'
  | 'Mental Health'
  | 'Veterans'
  | "Women's"
  | 'Faith-Based';

type GroupPrivacy = 'open' | 'private';

interface SupportGroup {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: GroupCategory;
  readonly privacy: GroupPrivacy;
  readonly rules: string;
  readonly memberIds: readonly string[];
  readonly pendingIds: readonly string[];
  readonly createdBy: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly lastActiveAt: Timestamp;
}

interface GroupMessage {
  readonly id: string;
  readonly authorId: string;
  readonly authorName: string;
  readonly text: string;
  readonly createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: readonly GroupCategory[] = [
  'Recovery',
  'Housing',
  'Employment',
  'Family',
  'Mental Health',
  'Veterans',
  "Women's",
  'Faith-Based',
];

const CATEGORY_COLORS: Record<GroupCategory, string> = {
  Recovery: 'bg-green-50 text-green-700 border-green-200',
  Housing: 'bg-blue-50 text-blue-700 border-blue-200',
  Employment: 'bg-purple-50 text-purple-700 border-purple-200',
  Family: 'bg-pink-50 text-pink-700 border-pink-200',
  'Mental Health': 'bg-teal-50 text-teal-700 border-teal-200',
  Veterans: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  "Women's": 'bg-rose-50 text-rose-700 border-rose-200',
  'Faith-Based': 'bg-amber-50 text-amber-700 border-amber-200',
};

const MOCK_GROUPS: readonly Omit<SupportGroup, 'id'>[] = [
  {
    name: 'Phoenix Sober Living Circle',
    description:
      'A safe space for those in early recovery to share experiences, find accountability partners, and celebrate milestones together. Weekly check-ins and daily motivation.',
    category: 'Recovery',
    privacy: 'open',
    rules:
      '1. Be respectful and non-judgmental.\n2. What is shared here stays here.\n3. No substances discussion in a glorifying manner.\n4. Support, do not advise unless asked.',
    memberIds: ['mock-1', 'mock-2', 'mock-3', 'mock-4', 'mock-5', 'mock-6', 'mock-7'],
    pendingIds: [],
    createdBy: 'mock-1',
    createdAt: Timestamp.fromDate(new Date('2025-11-01')),
    updatedAt: Timestamp.fromDate(new Date('2026-02-20')),
    lastActiveAt: Timestamp.fromDate(new Date('2026-02-22T09:15:00')),
  },
  {
    name: 'AZ Housing Resources & Support',
    description:
      'Help finding stable housing in the Phoenix metro area. Share listings, tips on applications, know your rights as a tenant, and get help with deposits.',
    category: 'Housing',
    privacy: 'open',
    rules:
      '1. Verify information before sharing.\n2. No scams or spam.\n3. Be patient with everyone\'s situation.',
    memberIds: ['mock-1', 'mock-3', 'mock-8', 'mock-9'],
    pendingIds: [],
    createdBy: 'mock-3',
    createdAt: Timestamp.fromDate(new Date('2025-12-15')),
    updatedAt: Timestamp.fromDate(new Date('2026-02-21')),
    lastActiveAt: Timestamp.fromDate(new Date('2026-02-21T16:30:00')),
  },
  {
    name: 'Second Chance Careers',
    description:
      'For anyone navigating employment after incarceration or homelessness. Resume help, interview prep, fair-chance employer lists, and encouragement.',
    category: 'Employment',
    privacy: 'open',
    rules:
      '1. Share real opportunities only.\n2. No MLM or pyramid schemes.\n3. Celebrate every job win, big or small.',
    memberIds: ['mock-2', 'mock-4', 'mock-5', 'mock-10', 'mock-11', 'mock-12'],
    pendingIds: [],
    createdBy: 'mock-2',
    createdAt: Timestamp.fromDate(new Date('2026-01-05')),
    updatedAt: Timestamp.fromDate(new Date('2026-02-22')),
    lastActiveAt: Timestamp.fromDate(new Date('2026-02-22T11:00:00')),
  },
  {
    name: 'Family Reconnection',
    description:
      'Rebuilding family relationships after addiction or incarceration. Share your journey, get advice on boundaries, custody, and reconnecting with loved ones.',
    category: 'Family',
    privacy: 'private',
    rules:
      '1. Absolute confidentiality required.\n2. No judgment on family situations.\n3. Discuss your own experience, not others\'.',
    memberIds: ['mock-1', 'mock-6', 'mock-7'],
    pendingIds: ['mock-11'],
    createdBy: 'mock-6',
    createdAt: Timestamp.fromDate(new Date('2026-01-10')),
    updatedAt: Timestamp.fromDate(new Date('2026-02-19')),
    lastActiveAt: Timestamp.fromDate(new Date('2026-02-19T20:45:00')),
  },
  {
    name: 'Mindful Recovery Phoenix',
    description:
      'Meditation, breathing exercises, and mental health strategies for people in recovery. Weekly guided sessions and daily mindfulness challenges.',
    category: 'Mental Health',
    privacy: 'open',
    rules:
      '1. This is not a substitute for professional help.\n2. Share resources, not diagnoses.\n3. Be gentle with yourself and others.',
    memberIds: ['mock-2', 'mock-3', 'mock-8', 'mock-9', 'mock-10'],
    pendingIds: [],
    createdBy: 'mock-8',
    createdAt: Timestamp.fromDate(new Date('2025-10-20')),
    updatedAt: Timestamp.fromDate(new Date('2026-02-22')),
    lastActiveAt: Timestamp.fromDate(new Date('2026-02-22T07:30:00')),
  },
  {
    name: 'Veterans Recovery Network',
    description:
      'Fellow veterans supporting each other through recovery. Understanding the unique challenges of military to civilian transition, PTSD, and finding purpose.',
    category: 'Veterans',
    privacy: 'private',
    rules:
      '1. Respect all branches and service histories.\n2. Confidentiality is mandatory.\n3. Crisis resources are pinned at the top.',
    memberIds: ['mock-4', 'mock-5', 'mock-12'],
    pendingIds: ['mock-2'],
    createdBy: 'mock-4',
    createdAt: Timestamp.fromDate(new Date('2025-09-01')),
    updatedAt: Timestamp.fromDate(new Date('2026-02-20')),
    lastActiveAt: Timestamp.fromDate(new Date('2026-02-20T14:00:00')),
  },
  {
    name: "Women's Strength Circle",
    description:
      'A women-only space for recovery support, sharing stories, and building each other up. Topics include safety, self-care, parenting, and empowerment.',
    category: "Women's",
    privacy: 'private',
    rules:
      '1. Women-identifying individuals only.\n2. Absolute confidentiality.\n3. Trigger warnings for sensitive topics.\n4. No photos without consent.',
    memberIds: ['mock-6', 'mock-7', 'mock-9', 'mock-13'],
    pendingIds: [],
    createdBy: 'mock-7',
    createdAt: Timestamp.fromDate(new Date('2025-11-15')),
    updatedAt: Timestamp.fromDate(new Date('2026-02-21')),
    lastActiveAt: Timestamp.fromDate(new Date('2026-02-21T19:00:00')),
  },
  {
    name: 'Faith & Recovery Fellowship',
    description:
      'Exploring the role of faith in recovery. All faiths and spiritual paths welcome. Share scriptures, prayers, and spiritual practices that help you stay strong.',
    category: 'Faith-Based',
    privacy: 'open',
    rules:
      '1. All faiths and spiritual paths are respected.\n2. No proselytizing or pressuring.\n3. Share what helps you, not what others should believe.',
    memberIds: ['mock-1', 'mock-3', 'mock-5', 'mock-8', 'mock-10', 'mock-11', 'mock-13'],
    pendingIds: [],
    createdBy: 'mock-5',
    createdAt: Timestamp.fromDate(new Date('2025-08-01')),
    updatedAt: Timestamp.fromDate(new Date('2026-02-22')),
    lastActiveAt: Timestamp.fromDate(new Date('2026-02-22T08:00:00')),
  },
  {
    name: 'New Freedom NA Group',
    description:
      'Narcotics Anonymous group meeting virtually and in person at the New Freedom AZ center. All are welcome. Meeting schedule posted weekly.',
    category: 'Recovery',
    privacy: 'open',
    rules:
      '1. Follow NA traditions.\n2. What you hear here, let it stay here.\n3. One person speaks at a time.\n4. No crosstalk.',
    memberIds: ['mock-1', 'mock-2', 'mock-3', 'mock-4', 'mock-6', 'mock-8', 'mock-9', 'mock-10', 'mock-11'],
    pendingIds: [],
    createdBy: 'mock-1',
    createdAt: Timestamp.fromDate(new Date('2025-07-01')),
    updatedAt: Timestamp.fromDate(new Date('2026-02-22')),
    lastActiveAt: Timestamp.fromDate(new Date('2026-02-22T12:00:00')),
  },
  {
    name: 'Desert Hope Job Club',
    description:
      'Weekly job club for people in the Phoenix area looking for work. We practice interviews, review resumes, and share leads from fair-chance employers.',
    category: 'Employment',
    privacy: 'open',
    rules:
      '1. Show up prepared.\n2. Share real leads only.\n3. Be encouraging, not competitive.',
    memberIds: ['mock-2', 'mock-5', 'mock-11', 'mock-12'],
    pendingIds: [],
    createdBy: 'mock-11',
    createdAt: Timestamp.fromDate(new Date('2026-01-20')),
    updatedAt: Timestamp.fromDate(new Date('2026-02-21')),
    lastActiveAt: Timestamp.fromDate(new Date('2026-02-21T10:00:00')),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function getLetterAvatar(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-amber-100 text-amber-800',
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-teal-100 text-teal-800',
    'bg-indigo-100 text-indigo-800',
    'bg-rose-100 text-rose-800',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function isMember(group: SupportGroup, uid: string): boolean {
  return group.memberIds.includes(uid);
}

function isPending(group: SupportGroup, uid: string): boolean {
  return group.pendingIds.includes(uid);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-stone-200 p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-stone-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-stone-200 rounded" />
              <div className="h-3 w-20 bg-stone-100 rounded" />
              <div className="h-3 w-full bg-stone-100 rounded" />
              <div className="h-3 w-3/4 bg-stone-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryPills({
  selected,
  onSelect,
}: {
  selected: GroupCategory | null;
  onSelect: (cat: GroupCategory | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          selected === null
            ? 'bg-amber-500 text-white'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
        }`}
      >
        All
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(selected === cat ? null : cat)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selected === cat
              ? 'bg-amber-500 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

function GroupCard({
  group,
  uid,
  onJoin,
  onLeave,
  onRequestJoin,
  onSelect,
}: {
  group: SupportGroup;
  uid: string;
  onJoin: (groupId: string) => void;
  onLeave: (groupId: string) => void;
  onRequestJoin: (groupId: string) => void;
  onSelect: (group: SupportGroup) => void;
}) {
  const member = isMember(group, uid);
  const pending = isPending(group, uid);
  const lastActive = group.lastActiveAt?.toDate
    ? formatTimeAgo(group.lastActiveAt.toDate())
    : '';
  const categoryStyle = CATEGORY_COLORS[group.category] || 'bg-stone-50 text-stone-600';
  const avatarColor = getAvatarColor(group.name);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (member) {
      onLeave(group.id);
    } else if (pending) {
      // Do nothing, pending state
    } else if (group.privacy === 'private') {
      onRequestJoin(group.id);
    } else {
      onJoin(group.id);
    }
  };

  return (
    <button
      onClick={() => onSelect(group)}
      className="w-full bg-white rounded-xl border border-stone-200 p-4 text-left hover:border-amber-200 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Letter Avatar */}
        <div
          className={`h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarColor}`}
        >
          {getLetterAvatar(group.name)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-stone-800 text-sm truncate">{group.name}</h3>
            {group.privacy === 'private' && (
              <Lock className="h-3 w-3 text-stone-400 flex-shrink-0" />
            )}
          </div>

          {/* Category + member count */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${categoryStyle}`}
            >
              {group.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <Users className="h-3 w-3" />
              {group.memberIds.length}
            </span>
            <span className="flex items-center gap-1 text-xs text-stone-400">
              {group.privacy === 'open' ? (
                <Globe className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {group.privacy === 'open' ? 'Open' : 'Private'}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-stone-500 mt-1.5 line-clamp-2">{group.description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <span className="flex items-center gap-1 text-[10px] text-stone-400">
              <Clock className="h-3 w-3" />
              Active {lastActive}
            </span>

            {member ? (
              <span
                onClick={handleAction}
                className="px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                Joined
              </span>
            ) : pending ? (
              <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium border border-yellow-200">
                Pending
              </span>
            ) : (
              <span
                onClick={handleAction}
                className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
              >
                {group.privacy === 'private' ? 'Request' : 'Join'}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Group Detail View
// ---------------------------------------------------------------------------

function MemberListItem({ memberId }: { memberId: string }) {
  const color = getAvatarColor(memberId);
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${color}`}
      >
        {memberId.substring(0, 2).toUpperCase()}
      </div>
      <span className="text-sm text-stone-700 truncate">Community Member</span>
    </div>
  );
}

function GroupDetail({
  group,
  uid,
  onBack,
  onJoin,
  onLeave,
  onRequestJoin,
}: {
  group: SupportGroup;
  uid: string;
  onBack: () => void;
  onJoin: (groupId: string) => void;
  onLeave: (groupId: string) => void;
  onRequestJoin: (groupId: string) => void;
}) {
  const member = isMember(group, uid);
  const pending = isPending(group, uid);
  const avatarColor = getAvatarColor(group.name);
  const categoryStyle = CATEGORY_COLORS[group.category] || 'bg-stone-50 text-stone-600';
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [activeSection, setActiveSection] = useState<'discussion' | 'info'>('discussion');

  const visibleMembers = showAllMembers
    ? group.memberIds
    : group.memberIds.slice(0, 10);

  const handleAction = () => {
    if (member) {
      onLeave(group.id);
    } else if (pending) {
      // Do nothing
    } else if (group.privacy === 'private') {
      onRequestJoin(group.id);
    } else {
      onJoin(group.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarColor}`}
        >
          {getLetterAvatar(group.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-stone-800 text-base truncate">{group.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${categoryStyle}`}
            >
              {group.category}
            </span>
            <span className="text-xs text-stone-400">
              {group.memberIds.length} members
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div>
        {member ? (
          <button
            onClick={handleAction}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Leave Group
          </button>
        ) : pending ? (
          <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-sm font-medium">
            <Clock className="h-4 w-4" />
            Request Pending
          </div>
        ) : (
          <button
            onClick={handleAction}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            {group.privacy === 'private' ? 'Request to Join' : 'Join Group'}
          </button>
        )}
      </div>

      {/* Section toggle */}
      <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
        <button
          onClick={() => setActiveSection('discussion')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            activeSection === 'discussion'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Discussion
        </button>
        <button
          onClick={() => setActiveSection('info')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            activeSection === 'info'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <ScrollText className="h-3.5 w-3.5" />
          Info & Rules
        </button>
      </div>

      {activeSection === 'discussion' ? (
        member ? (
          <GroupDiscussion groupId={group.id} uid={uid} userName="" />
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
            <Lock className="h-8 w-8 text-stone-300 mx-auto" />
            <h3 className="font-medium text-stone-800 mt-3">Members Only</h3>
            <p className="text-sm text-stone-500 mt-1">
              Join this group to participate in the discussion.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {/* Description */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h3 className="font-semibold text-stone-800 text-sm mb-2">About</h3>
            <p className="text-sm text-stone-600 leading-relaxed">{group.description}</p>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-100">
              <div className="flex items-center gap-1 text-xs text-stone-400">
                {group.privacy === 'open' ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {group.privacy === 'open' ? 'Open Group' : 'Private Group'}
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-400">
                <Users className="h-3 w-3" />
                {group.memberIds.length} members
              </div>
            </div>
          </div>

          {/* Rules */}
          {group.rules && (
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <h3 className="font-semibold text-stone-800 text-sm mb-2">Group Rules</h3>
              <div className="text-sm text-stone-600 whitespace-pre-line leading-relaxed">
                {group.rules}
              </div>
            </div>
          )}

          {/* Members */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h3 className="font-semibold text-stone-800 text-sm mb-2">
              Members ({group.memberIds.length})
            </h3>
            <div className="divide-y divide-stone-50">
              {visibleMembers.map((memberId) => (
                <MemberListItem key={memberId} memberId={memberId} />
              ))}
            </div>
            {group.memberIds.length > 10 && !showAllMembers && (
              <button
                onClick={() => setShowAllMembers(true)}
                className="flex items-center gap-1 mt-2 text-amber-600 text-xs font-medium hover:text-amber-700"
              >
                View all {group.memberIds.length} members
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group Discussion / Chat
// ---------------------------------------------------------------------------

function GroupDiscussion({
  groupId,
  uid,
  userName,
}: {
  groupId: string;
  uid: string;
  userName: string;
}) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time message listener using demo-aware service layer
  useEffect(() => {
    const unsubscribe = subscribeToCollection<GroupMessage>(
      `groups/${groupId}/messages`,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      orderBy('createdAt', 'asc')
    );

    return () => unsubscribe();
  }, [groupId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !uid) return;
    setSending(true);
    try {
      await addDocument(`groups/${groupId}/messages`, {
        authorId: uid,
        authorName: userName || 'Community Member',
        text: newMessage.trim(),
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      {/* Messages area */}
      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-8 w-8 text-stone-300" />
            <p className="text-sm text-stone-500 mt-2">No messages yet</p>
            <p className="text-xs text-stone-400 mt-0.5">Be the first to say something</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.authorId === uid;
            const avatarColor = getAvatarColor(msg.authorName || msg.authorId);
            const timestamp = msg.createdAt?.toDate
              ? formatTimeAgo(msg.createdAt.toDate())
              : '';

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 ${avatarColor}`}
                >
                  {getLetterAvatar(msg.authorName || msg.authorId)}
                </div>
                <div className={`max-w-[75%] ${isOwn ? 'text-right' : 'text-left'}`}>
                  {!isOwn && (
                    <p className="text-[10px] text-stone-400 mb-0.5">
                      {msg.authorName || 'Member'}
                    </p>
                  )}
                  <div
                    className={`inline-block rounded-2xl px-3.5 py-2 text-sm ${
                      isOwn
                        ? 'bg-amber-700 text-white rounded-br-md'
                        : 'bg-stone-100 text-stone-800 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {timestamp && (
                    <p className="text-[10px] text-stone-400 mt-0.5">{timestamp}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 p-3 border-t border-stone-200 bg-stone-50">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 h-10 rounded-full border border-stone-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Group Modal
// ---------------------------------------------------------------------------

function CreateGroupModal({
  uid,
  onClose,
  onCreated,
}: {
  uid: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GroupCategory>('Recovery');
  const [privacy, setPrivacy] = useState<GroupPrivacy>('open');
  const [rules, setRules] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }
    if (name.trim().length < 3) {
      setError('Group name must be at least 3 characters.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }

    setCreating(true);
    try {
      await addDocument('groups', {
        name: name.trim(),
        description: description.trim(),
        category,
        privacy,
        rules: rules.trim(),
        memberIds: [uid],
        pendingIds: [],
        createdBy: uid,
        lastActiveAt: Timestamp.now(),
      });
      onCreated();
    } catch (err) {
      console.error('Failed to create group:', err);
      setError('Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b border-stone-200 rounded-t-2xl z-10">
          <h2 className="font-bold text-stone-800 text-base">Create Group</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Error */}
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Group Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Phoenix Recovery Circle"
              maxLength={80}
              className="w-full h-10 rounded-lg border border-stone-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about? Who should join?"
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <p className="text-[10px] text-stone-400 mt-0.5 text-right">
              {description.length}/500
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GroupCategory)}
                className="w-full h-10 rounded-lg border border-stone-300 px-3 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            </div>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Privacy</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPrivacy('open')}
                className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                  privacy === 'open'
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                <Globe className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium text-xs">Open</p>
                  <p className="text-[10px] opacity-70">Anyone can join</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPrivacy('private')}
                className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                  privacy === 'private'
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                <Lock className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium text-xs">Private</p>
                  <p className="text-[10px] opacity-70">Requires approval</p>
                </div>
              </button>
            </div>
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Group Rules <span className="text-stone-400 text-xs font-normal">(optional)</span>
            </label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Guidelines for group members..."
              rows={3}
              maxLength={1000}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 h-11 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Group
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

type Tab = 'discover' | 'my-groups';

export default function Groups() {
  const { firebaseUser, user } = useAuth();
  const uid = firebaseUser?.uid || '';
  const displayName = user?.displayName || firebaseUser?.displayName || '';

  // UI state
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GroupCategory | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<SupportGroup | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch groups from Firestore
  const { data: firestoreGroups, loading } = useCollection<SupportGroup>('groups');

  // Merge Firestore groups with mock groups (mock groups only shown if Firestore has none)
  const allGroups: SupportGroup[] = useMemo(() => {
    if (firestoreGroups.length > 0) {
      return firestoreGroups;
    }
    // Use mock data when Firestore is empty
    return MOCK_GROUPS.map((g, i) => ({
      ...g,
      id: `mock-group-${i}`,
    })) as unknown as SupportGroup[];
  }, [firestoreGroups]);

  // Filter groups
  const filteredGroups = useMemo(() => {
    let result = [...allGroups];

    // Tab filter
    if (activeTab === 'my-groups') {
      result = result.filter((g) => isMember(g, uid) || isPending(g, uid));
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((g) => g.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allGroups, activeTab, selectedCategory, searchQuery, uid]);

  // Handlers — immutable array operations
  const handleJoin = useCallback(
    async (groupId: string) => {
      if (!uid) return;
      const group = allGroups.find((g) => g.id === groupId);
      if (!group || isMember(group, uid)) return;

      try {
        const updatedMemberIds = [...group.memberIds, uid];
        await updateDocument('groups', groupId, {
          memberIds: updatedMemberIds,
          lastActiveAt: Timestamp.now(),
        });
      } catch (err) {
        console.error('Failed to join group:', err);
      }
    },
    [uid, allGroups]
  );

  const handleLeave = useCallback(
    async (groupId: string) => {
      if (!uid) return;
      const group = allGroups.find((g) => g.id === groupId);
      if (!group || !isMember(group, uid)) return;

      try {
        const updatedMemberIds = group.memberIds.filter((id) => id !== uid);
        await updateDocument('groups', groupId, {
          memberIds: updatedMemberIds,
        });
        // Go back to list if viewing the left group
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null);
        }
      } catch (err) {
        console.error('Failed to leave group:', err);
      }
    },
    [uid, allGroups, selectedGroup]
  );

  const handleRequestJoin = useCallback(
    async (groupId: string) => {
      if (!uid) return;
      const group = allGroups.find((g) => g.id === groupId);
      if (!group || isMember(group, uid) || isPending(group, uid)) return;

      try {
        const updatedPendingIds = [...group.pendingIds, uid];
        await updateDocument('groups', groupId, {
          pendingIds: updatedPendingIds,
        });
      } catch (err) {
        console.error('Failed to request join:', err);
      }
    },
    [uid, allGroups]
  );

  const handleGroupCreated = () => {
    setShowCreateModal(false);
    setActiveTab('my-groups');
  };

  // If a group is selected, show detail view
  if (selectedGroup) {
    // Keep selected group data fresh from allGroups
    const freshGroup = allGroups.find((g) => g.id === selectedGroup.id) || selectedGroup;

    return (
      <div className="space-y-4">
        <GroupDetail
          group={freshGroup}
          uid={uid}
          onBack={() => setSelectedGroup(null)}
          onJoin={handleJoin}
          onLeave={handleLeave}
          onRequestJoin={handleRequestJoin}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800">Support Groups</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Find your people. You are not alone.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </div>

      {/* Safety Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            All groups are moderated. Report any concerns to our support team.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search groups..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent bg-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'discover'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          Discover
        </button>
        <button
          onClick={() => setActiveTab('my-groups')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'my-groups'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          My Groups
        </button>
      </div>

      {/* Category Filter Pills */}
      <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />

      {/* Groups Grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <Users className="h-10 w-10 text-stone-300 mx-auto" />
          <h3 className="font-medium text-stone-800 mt-3">
            {activeTab === 'my-groups' ? 'No groups joined yet' : 'No groups found'}
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            {activeTab === 'my-groups'
              ? 'Browse the Discover tab to find groups that match your journey.'
              : searchQuery || selectedCategory
              ? 'Try a different search or category.'
              : 'Be the first to create a support group for your community.'}
          </p>
          {activeTab === 'my-groups' && (
            <button
              onClick={() => setActiveTab('discover')}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              Discover Groups
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              uid={uid}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onRequestJoin={handleRequestJoin}
              onSelect={setSelectedGroup}
            />
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          uid={uid}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}
