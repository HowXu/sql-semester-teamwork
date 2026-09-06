import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppUser {
  id: string;
  name: string;
  role: "student" | "teacher" | "admin";
  department: string;
  studentId?: string;
  teacherId?: string;
}

export const PRESET_USERS: AppUser[] = [
  {
    id: "usr_stu_1",
    name: "李明",
    role: "student",
    department: "计算机科学与技术学院",
    studentId: "20240101",
  },
  {
    id: "usr_stu_2",
    name: "苏晓彤",
    role: "student",
    department: "计算机科学与技术学院",
    studentId: "20240102",
  },
  {
    id: "usr_tch_1",
    name: "张博远 教授",
    role: "teacher",
    department: "计算机科学与技术学院",
    teacherId: "T1001",
  },
  {
    id: "usr_admin_1",
    name: "教务管理中心",
    role: "admin",
    department: "教务处",
  },
];

interface UserState {
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  switchUserById: (id: string) => void;
}

const defaultUser: AppUser = PRESET_USERS[0]!;

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: defaultUser,
      setCurrentUser: (user) => set({ currentUser: user }),
      switchUserById: (id) => {
        const normalizedId =
          id === "user-s1" ? "usr_stu_1" :
          id === "user-s2" ? "usr_stu_2" :
          id === "user-t1" ? "usr_tch_1" :
          id === "user-a1" ? "usr_admin_1" : id;
        const found = PRESET_USERS.find((u) => u.id === normalizedId || u.id === id);
        if (found) {
          set({ currentUser: found });
        }
      },
    }),
    {
      name: "academic-active-user-v3",
      migrate: (persistedState: unknown) => {
        const state = persistedState as { currentUser?: AppUser };
        if (!state?.currentUser || state.currentUser.id?.startsWith("user-")) {
          return { currentUser: defaultUser };
        }
        return state;
      },
    }
  )
);
