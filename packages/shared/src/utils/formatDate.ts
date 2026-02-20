import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function toDate(timestamp: Timestamp | Date | null | undefined): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if ('toDate' in timestamp) return timestamp.toDate();
  return null;
}

export function formatDate(timestamp: Timestamp | Date | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) return '';
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, yyyy');
}

export function formatRelative(timestamp: Timestamp | Date | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) return '';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDateTime(timestamp: Timestamp | Date | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) return '';
  return format(date, 'MMM d, yyyy h:mm a');
}
