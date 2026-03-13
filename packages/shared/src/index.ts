// Shared types between API and Mobile

export type SubscriptionTier = 'FREE' | 'FAMILY';
export type CircleRole = 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type RecurringType = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
export type MedLogStatus = 'PENDING' | 'TAKEN' | 'SKIPPED' | 'MISSED';
export type MoodLevel = 'GREAT' | 'GOOD' | 'OKAY' | 'LOW' | 'BAD';
export type AppointmentStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
export type DocCategory = 'INSURANCE' | 'PRESCRIPTION' | 'LEGAL' | 'MEDICAL' | 'ID' | 'OTHER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  timezone: string;
  subscriptionTier: SubscriptionTier;
}

export interface CareCircle {
  id: string;
  name: string;
  careRecipient: string;
  recipientDob?: string;
  recipientPhoto?: string;
}

export interface NotificationData {
  type: string;
  circleId?: string;
  taskId?: string;
  entryId?: string;
  alertId?: string;
}
