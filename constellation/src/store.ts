import { create } from 'zustand';

interface ConstellationState {
  selectedGoalId: string | null;
  hoveredGoalId: string | null;
  presentationMode: boolean;
  toaVisible: boolean;
  selectGoal: (id: string | null) => void;
  hoverGoal: (id: string | null) => void;
  togglePresentation: () => void;
  toggleToa: () => void;
}

export const useStore = create<ConstellationState>((set) => ({
  selectedGoalId: null,
  hoveredGoalId: null,
  presentationMode: false,
  toaVisible: true,

  selectGoal: (id) => set({ selectedGoalId: id }),
  hoverGoal: (id) => set({ hoveredGoalId: id }),
  togglePresentation: () => set((s) => ({ presentationMode: !s.presentationMode, selectedGoalId: null })),
  toggleToa: () => set((s) => ({ toaVisible: !s.toaVisible })),
}));
