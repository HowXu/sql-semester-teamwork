import { useUserStore, PRESET_USERS } from "@/shared/stores/useUserStore";
import { useCourseDraftStore } from "@/shared/stores/useCourseDraftStore";
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Award,
  BarChart3,
  ShoppingCart,
  User,
  ChevronDown,
} from "@/shared/icons";
import { Badge } from "@/shared/ui";
import { useState } from "react";

export interface NavbarProps {
  currentTab: "timetable" | "courses" | "grades" | "admin";
  onTabChange: (tab: "timetable" | "courses" | "grades" | "admin") => void;
}

export function Navbar({ currentTab, onTabChange }: NavbarProps) {
  const { currentUser, switchUserById } = useUserStore();
  const { drafts, setOpen } = useCourseDraftStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="flex h-20 w-full items-center justify-between gap-4 px-6 sm:px-10">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              综合教务选课系统
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              2026-2027学年 第一学期
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onTabChange("timetable")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all ${
              currentTab === "timetable"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span>我的课表</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("courses")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all ${
              currentTab === "courses"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span>选课大厅</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("grades")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all ${
              currentTab === "grades"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Award className="h-5 w-5" />
            <span>成绩与GPA</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("admin")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all ${
              currentTab === "admin"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span>教学大盘</span>
          </button>
        </nav>

        {/* Right Actions: Draft Cart & User Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Pre-selection Cart button (Task 6 会按角色隐藏) */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-sm sm:text-base font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
            title="查看预选车"
            aria-label="查看预选车"
          >
            <ShoppingCart className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">预选清单</span>
            {drafts.length > 0 && (
              <Badge variant="success" className="px-2 py-0 text-sm font-bold">
                {drafts.length}
              </Badge>
            )}
          </button>

          {/* User Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-sm sm:text-base font-semibold text-foreground shadow-2xs hover:bg-muted transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary font-bold">
                <User className="h-5 w-5" />
              </div>
              <div className="text-left hidden md:block">
                <div className="leading-tight font-bold text-base">{currentUser.name}</div>
                <div className="text-sm text-muted-foreground font-medium">
                  {currentUser.studentId || currentUser.teacherId || "教务处"}
                </div>
              </div>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-border bg-card p-2.5 shadow-xl">
                  <div className="px-3 py-2 text-sm font-semibold text-muted-foreground border-b border-border/60">
                    切换当前用户角色
                  </div>
                  <div className="py-1.5 space-y-1">
                    {PRESET_USERS.map((u) => {
                      const isActive = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            switchUserById(u.id);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm sm:text-base transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground font-bold"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{u.name}</div>
                            <div
                                className={`text-sm ${
                                isActive ? "text-primary-foreground/90" : "text-muted-foreground"
                              }`}
                            >
                              {u.department} · {u.studentId || u.teacherId || "管理员"}
                            </div>
                          </div>
                          {isActive && <span className="text-sm font-bold">当前</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
