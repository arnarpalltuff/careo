import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const aiService = {
  chat: (message: string, history?: ChatMessage[], circleId?: string) =>
    api.post<{ message: string }>('/ai/chat', { message, history, circleId }).then((r) => r.data),

  suggestions: () =>
    api.get<{ suggestions: string[] }>('/ai/suggestions').then((r) => r.data),
};
