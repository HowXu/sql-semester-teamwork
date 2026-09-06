import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  showWeekend: boolean;
  highlightConflicts: boolean;
  activeSemester: string;
  setShowWeekend: (show: boolean) => void;
  setHighlightConflicts: (highlight: boolean) => void;
  setActiveSemester: (sem: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      showWeekend: false,
      highlightConflicts: true,
      activeSemester: "2026-2027-1",
      setShowWeekend: (show) => set({ showWeekend: show }),
      setHighlightConflicts: (highlight) => set({ highlightConflicts: highlight }),
      setActiveSemester: (sem) => set({ activeSemester: sem }),
    }),
    {
      name: "academic-preferences",
    }
  )
);
