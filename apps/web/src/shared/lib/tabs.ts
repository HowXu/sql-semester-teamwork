import type { AppUser } from "@/shared/stores/useUserStore";

export type TabType = "timetable" | "courses" | "grades" | "admin";

type Role = AppUser["role"];

export const ROLE_VISIBLE_TABS: Readonly<Record<Role, ReadonlyArray<TabType>>> = {
  student: ["timetable", "courses", "grades"],
  teacher: ["timetable", "admin"],
  admin: ["courses", "admin"],
};

export function getDefaultTabForRole(role: Role): TabType {
  const first = ROLE_VISIBLE_TABS[role][0];
  return first ?? "timetable";
}

export function isTabVisibleForRole(tab: TabType, role: Role): boolean {
  return ROLE_VISIBLE_TABS[role].includes(tab);
}
