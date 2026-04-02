import api from './api';

export interface ActivityItem {
  id: string;
  type: 'task_completed' | 'med_taken' | 'med_missed' | 'journal_added' | 'emergency' | 'member_joined';
  title: string;
  subtitle: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export const activityService = {
  list: (circleId: string, limit = 20): Promise<{ activity: ActivityItem[] }> =>
    api.get(`/circles/${circleId}/activity`, { params: { limit } }).then((r) => r.data),
};
