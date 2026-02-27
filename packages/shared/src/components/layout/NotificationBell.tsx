import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Calendar, MessageCircle, Award, AlertTriangle, Briefcase, Users, Settings } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { updateDocument } from '../../services/firebase/firestore';
import type { AppNotification, NotificationType } from '../../types';

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  appointment_reminder: <Calendar className="h-4 w-4 text-blue-600" />,
  message: <MessageCircle className="h-4 w-4 text-blue-600" />,
  achievement: <Award className="h-4 w-4 text-blue-500" />,
  milestone: <Award className="h-4 w-4 text-green-600" />,
  system: <Settings className="h-4 w-4 text-slate-500" />,
  job_match: <Briefcase className="h-4 w-4 text-emerald-600" />,
  community: <Users className="h-4 w-4 text-purple-600" />,
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotificationItem({ notification, onMarkRead }: {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
}) {
  const icon = NOTIFICATION_ICONS[notification.type] || <Bell className="h-4 w-4 text-slate-500" />;
  const timeAgo = notification.createdAt
    ? formatTimeAgo(
        notification.createdAt instanceof Date
          ? notification.createdAt
          : typeof (notification.createdAt as any).toDate === 'function'
          ? (notification.createdAt as any).toDate()
          : new Date(notification.createdAt as any)
      )
    : '';

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
        !notification.read ? 'bg-blue-50/50' : ''
      }`}
      onClick={() => !notification.read && onMarkRead(notification.id)}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.read ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-slate-400 mt-1">{timeAgo}</p>
      </div>
      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
      )}
    </div>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, loading } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    await updateDocument('notifications', id, { read: true });
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) => updateDocument('notifications', n.id, { read: true }))
    );
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-72 divide-y divide-slate-100">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
