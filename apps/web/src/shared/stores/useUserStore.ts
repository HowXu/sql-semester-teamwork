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
    id: "user-s1",
    name: "李明",
    role: "student",
    department: "计算机科学与技术学院",
    studentId: "20240101",
  },
  {
    id: "user-s2",
    name: "苏晓彤",
    role: "student",
    department: "计算机科学与技术学院",
    studentId: "20240102",
  },
  {
    id: "user-t1",
    name: "张博远 教授",
    role: "teacher",
    department: "计算机科学与技术学院",
    teacherId: "T1001",
  },
  {
    id: "user-a1",
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

const defaultUser: AppUser = {
  id: "user-s1",
  name: "李明",
  role: "student",
  department: "计算机科学与技术学院",
  studentId: "20240101",
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: defaultUser,
      setCurrentUser: (user) => set({ currentUser: user }),
      switchUserById: (id) => {
        const found = PRESET_USERS.find((u) => u.id === id);
        if (found) {
          set({ currentUser: found });
        }
      },
    }),
    {
      name: "academic-active-user",
    }
  )
);
