import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE, MMM d');
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return format(d, 'EEE, MMM d \'at\' h:mm a');
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes);
  return format(d, 'h:mm a');
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
