import { create } from 'zustand';

interface Circle {
  id: string;
  name: string;
  careRecipient: string;
  memberCount: number;
  myRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

interface CircleState {
  activeCircleId: string | null;
  circles: Circle[];
  setActiveCircle: (id: string) => void;
  setCircles: (circles: Circle[]) => void;
  getActiveCircle: () => Circle | undefined;
}

export const useCircleStore = create<CircleState>((set, get) => ({
  activeCircleId: null,
  circles: [],

  setActiveCircle: (id) => set({ activeCircleId: id }),

  setCircles: (circles) => {
    const state = get();
    const newState: Partial<CircleState> = { circles };
    if (!state.activeCircleId && circles.length > 0) {
      newState.activeCircleId = circles[0].id;
    }
    set(newState);
  },

  getActiveCircle: () => {
    const state = get();
    return state.circles.find((c) => c.id === state.activeCircleId);
  },
}));
