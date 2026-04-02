import api from './api';

export interface InsightsData {
  period: { days: number; since: string };
  mood: {
    trend: { date: string; mood: string; moodScore: number; energy: number | null; pain: number | null }[];
    entries: number;
    averageScore: number | null;
  };
  medications: {
    adherenceRate: number | null;
    totalDoses: number;
    takenDoses: number;
    missedDoses: number;
    skippedDoses: number;
    weeklyAdherence: { week: string; rate: number; total: number }[];
  };
  tasks: {
    total: number;
    completed: number;
    completionRate: number | null;
  };
  appointments: {
    total: number;
    completed: number;
  };
  circle: { memberCount: number };
}

export const insightsService = {
  get: (circleId: string, days = 30) =>
    api.get<InsightsData>(`/circles/${circleId}/insights`, { params: { days } }).then((r) => r.data),
};
