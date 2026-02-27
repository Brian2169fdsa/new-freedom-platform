import React, { useState } from 'react';
import { useAuth, useCollection, type Post, type Achievement } from '@reprieve/shared';
import { where, orderBy, limit } from 'firebase/firestore';
import {
  Heart, Settings, LogOut, BookHeart, MessageCircle, Award, Shield,
  Bell, ChevronRight, Camera, Edit3, Eye, EyeOff, HelpCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
      <div className="flex items-center justify-center text-blue-600 mb-1">{icon}</div>
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default function Profile() {
  const { firebaseUser, user, signOut } = useAuth();
  const uid = firebaseUser?.uid || '';

  const { data: myPosts } = useCollection<Post>(
    'posts',
    where('authorId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(5)
  );

  const { data: achievements } = useCollection<Achievement>(
    'achievements',
    where('userId', '==', uid),
    orderBy('earnedAt', 'desc'),
    limit(4)
  );

  const totalLikes = myPosts.reduce((sum, post) => sum + post.likes.length, 0);
  const totalStories = myPosts.filter((p) => p.type === 'story').length;

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-blue-700">
                  {(user?.displayName || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm">
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-800 text-lg truncate">
              {user?.displayName || 'Community Member'}
            </h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {user?.myStruggle?.joinDate && (
              <p className="text-xs text-slate-400 mt-1">
                Member since {(
                  user.myStruggle.joinDate instanceof Date
                    ? user.myStruggle.joinDate
                    : typeof (user.myStruggle.joinDate as any).toDate === 'function'
                    ? (user.myStruggle.joinDate as any).toDate()
                    : new Date(user.myStruggle.joinDate as any)
                ).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {user?.profile?.bio && (
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">{user.profile.bio}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Posts" value={myPosts.length} icon={<MessageCircle className="h-4 w-4" />} />
        <StatCard label="Stories" value={totalStories} icon={<BookHeart className="h-4 w-4" />} />
        <StatCard label="Likes" value={totalLikes} icon={<Heart className="h-4 w-4" />} />
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              Achievements
            </h3>
            <span className="text-xs text-slate-400">{achievements.length} earned</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-lg">
                  {achievement.icon || '🏅'}
                </div>
                <span className="text-[10px] text-slate-500 text-center truncate w-full">
                  {achievement.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {myPosts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Recent Posts</h3>
          <div className="space-y-2">
            {myPosts.slice(0, 3).map((post) => (
              <div key={post.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  {post.type === 'story' ? (
                    <BookHeart className="h-4 w-4 text-blue-600" />
                  ) : (
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span>{post.likes.length} likes</span>
                    <span>{post.commentCount} comments</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        <Link to="/donate" className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
          <Heart className="h-5 w-5 text-red-500" />
          <span className="flex-1 text-sm text-slate-700">Support the Community</span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>
        <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
          <Bell className="h-5 w-5 text-blue-600" />
          <span className="flex-1 text-left text-sm text-slate-700">Notifications</span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
        <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="flex-1 text-left text-sm text-slate-700">Privacy Settings</span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
        <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
          <HelpCircle className="h-5 w-5 text-slate-500" />
          <span className="flex-1 text-left text-sm text-slate-700">Help & Support</span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          <span className="flex-1 text-left text-sm text-red-600 font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
