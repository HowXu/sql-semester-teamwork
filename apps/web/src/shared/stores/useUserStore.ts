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
    name: "陈同学",
    role: "student",
    department: "计算机科学与技术学院",
    studentId: "2024001",
  },
  {
    id: "user-s2",
    name: "林同学",
    role: "student",
    department: "软件工程学院",
    studentId: "2024002",
  },
  {
    id: "user-t1",
    name: "张建国 教授",
    role: "teacher",
    department: "计算机科学与技术学院",
    teacherId: "T001",
  },
  {
    id: "user-a1",
    name: "教务管理科",
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
  name: "陈同学",
  role: "student",
  department: "计算机科学与技术学院",
  studentId: "2024001",
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
