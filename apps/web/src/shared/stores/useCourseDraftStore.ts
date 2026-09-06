import { create } from "zustand";

export interface DraftOffering {
  id: string;
  courseCode: string;
  courseName: string;
  credit: number;
  teacherName: string;
  classroom: string;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
}

interface CourseDraftState {
  drafts: DraftOffering[];
  isOpen: boolean;
  addDraft: (offering: DraftOffering) => boolean;
  removeDraft: (offeringId: string) => void;
  clearDrafts: () => void;
  setOpen: (open: boolean) => void;
}

export const useCourseDraftStore = create<CourseDraftState>((set, get) => ({
  drafts: [],
  isOpen: false,
  addDraft: (offering) => {
    const { drafts } = get();
    if (drafts.some((d) => d.id === offering.id)) {
      return false;
    }
    set({ drafts: [...drafts, offering], isOpen: true });
    return true;
  },
  removeDraft: (offeringId) => {
    set((state) => ({
      drafts: state.drafts.filter((d) => d.id !== offeringId),
    }));
  },
  clearDrafts: () => set({ drafts: [] }),
  setOpen: (open) => set({ isOpen: open }),
}));
