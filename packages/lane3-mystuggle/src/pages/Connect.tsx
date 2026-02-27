import React, { useState } from 'react';
import { useAuth, useCollection, type MentorMatch, type Conversation, type Message } from '@reprieve/shared';
import { where, orderBy, limit } from 'firebase/firestore';
import { addDocument, updateDocument } from '@reprieve/shared/services/firebase/firestore';
import { Link } from 'react-router-dom';
import {
  Users, MessageSquare, Search, Send, Heart, Shield, Clock,
  UserPlus, ChevronRight, Star, CheckCircle2, ArrowLeft, UsersRound,
} from 'lucide-react';

type Tab = 'find' | 'matches' | 'messages';

function MentorCard({ onRequest }: { onRequest: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Users className="h-6 w-6 text-blue-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800 text-sm">Available Mentor</h3>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              Available
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Experienced community member ready to share their journey and support yours.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Star className="h-3 w-3 text-blue-500" />
              <span>4.8 rating</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Heart className="h-3 w-3 text-red-400" />
              <span>12 mentees helped</span>
            </div>
          </div>
          <button
            onClick={onRequest}
            className="mt-3 flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Request Match
          </button>
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: MentorMatch }) {
  const statusColors: Record<string, string> = {
    proposed: 'bg-blue-100 text-blue-700',
    trial: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    ended: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Users className="h-5 w-5 text-blue-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-slate-800 text-sm">Mentor Match</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[match.status] || statusColors.ended}`}>
              {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{match.matchReason}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Star className="h-3 w-3 text-blue-500" />
              <span>Match score: {match.matchScore}%</span>
            </div>
          </div>
          {match.status === 'active' && (
            <button className="mt-2 flex items-center gap-1.5 text-blue-600 text-xs font-medium hover:text-blue-700">
              <MessageSquare className="h-3.5 w-3.5" />
              Send Message
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationCard({
  conversation,
  currentUserId,
  onSelect,
}: {
  conversation: Conversation;
  currentUserId: string;
  onSelect: () => void;
}) {
  const unread = conversation.unreadCount?.[currentUserId] || 0;
  const timeAgo = conversation.lastMessageAt
    ? formatTimeAgo(
        conversation.lastMessageAt instanceof Date
          ? conversation.lastMessageAt
          : typeof (conversation.lastMessageAt as any).toDate === 'function'
          ? (conversation.lastMessageAt as any).toDate()
          : new Date(conversation.lastMessageAt as any)
      )
    : '';

  return (
    <button
      onClick={onSelect}
      className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-blue-200 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="h-5 w-5 text-blue-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-800 text-sm truncate">
              {conversation.title || 'Conversation'}
            </h3>
            <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo}</span>
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">{conversation.lastMessage}</p>
        </div>
        {unread > 0 && (
          <span className="h-5 w-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center flex-shrink-0">
            {unread}
          </span>
        )}
      </div>
    </button>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function EmptyState({ tab }: { tab: Tab }) {
  const config = {
    find: {
      icon: <UserPlus className="h-8 w-8 text-slate-300" />,
      title: 'Find a Mentor',
      desc: 'Get paired with someone who has been where you are and can guide you forward.',
    },
    matches: {
      icon: <Users className="h-8 w-8 text-slate-300" />,
      title: 'No Matches Yet',
      desc: 'Request a mentor match to get connected with someone who understands your journey.',
    },
    messages: {
      icon: <MessageSquare className="h-8 w-8 text-slate-300" />,
      title: 'No Messages',
      desc: 'Start a conversation with your mentor or a peer.',
    },
  };
  const { icon, title, desc } = config[tab];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <div className="mx-auto mb-3">{icon}</div>
      <h3 className="font-medium text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
    </div>
  );
}

export default function Connect() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || '';
  const [activeTab, setActiveTab] = useState<Tab>('find');

  const { data: matches, loading: matchesLoading } = useCollection<MentorMatch>(
    'mentorMatches',
    where('menteeId', '==', uid)
  );

  const { data: conversations, loading: convsLoading } = useCollection<Conversation>(
    'conversations',
    where('participants', 'array-contains', uid),
    orderBy('lastMessageAt', 'desc')
  );

  const handleRequestMentor = async () => {
    if (!uid) return;
    await addDocument('mentorMatches', {
      menteeId: uid,
      mentorId: '',
      status: 'proposed',
      matchScore: 0,
      matchReason: 'User requested mentor match',
      feedbackScores: [],
    });
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'find', label: 'Find Mentor', icon: <UserPlus className="h-4 w-4" /> },
    { key: 'matches', label: 'My Matches', icon: <Users className="h-4 w-4" /> },
    { key: 'messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Connect</h1>
        <p className="text-sm text-slate-500 mt-0.5">Find a mentor or connect with peers</p>
      </div>

      {/* Safety Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            All connections are monitored for safety. Report any concerns to our support team.
          </p>
        </div>
      </div>

      {/* Support Groups Link */}
      <Link
        to="/groups"
        className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl border border-blue-200 p-4 hover:border-blue-300 transition-colors"
      >
        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
          <UsersRound className="h-5 w-5 text-blue-700" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm">Support Groups</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Find groups for recovery, housing, employment, and more
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
      </Link>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'find' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-blue-200 p-4">
            <h3 className="font-semibold text-slate-800 text-sm mb-1">How Mentoring Works</h3>
            <div className="space-y-2 mt-3">
              {[
                { step: '1', text: 'Request a mentor match based on your needs' },
                { step: '2', text: 'Get matched with an experienced community member' },
                { step: '3', text: 'Start with a 2-week trial period' },
                { step: '4', text: 'Continue meeting and growing together' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {step}
                  </div>
                  <p className="text-xs text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <MentorCard onRequest={handleRequestMentor} />
          <MentorCard onRequest={handleRequestMentor} />
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-3">
          {matchesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : matches.length === 0 ? (
            <EmptyState tab="matches" />
          ) : (
            matches.map((match) => <MatchCard key={match.id} match={match} />)
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-3">
          {convsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState tab="messages" />
          ) : (
            conversations.map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                currentUserId={uid}
                onSelect={() => {/* TODO: open conversation */}}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
