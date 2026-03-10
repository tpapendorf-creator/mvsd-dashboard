import { create } from 'zustand';

interface ConstellationState {
  selectedGoalId: string | null;
  hoveredGoalId: string | null;
  presentationMode: boolean;
  toaVisible: boolean;
  somosOpen: boolean;
  selectGoal: (id: string | null) => void;
  hoverGoal: (id: string | null) => void;
  togglePresentation: () => void;
  toggleToa: () => void;
  openSomos: () => void;
  closeSomos: () => void;
}

export const useStore = create<ConstellationState>((set) => ({
  selectedGoalId: null,
  hoveredGoalId: null,
  presentationMode: false,
  toaVisible: true,
  somosOpen: false,

  selectGoal: (id) => set({ selectedGoalId: id, somosOpen: false }),
  hoverGoal: (id) => set({ hoveredGoalId: id }),
  togglePresentation: () => set((s) => ({ presentationMode: !s.presentationMode, selectedGoalId: null, somosOpen: false })),
  toggleToa: () => set((s) => ({ toaVisible: !s.toaVisible })),
  openSomos: () => set({ somosOpen: true, selectedGoalId: null }),
  closeSomos: () => set({ somosOpen: false }),
}));
