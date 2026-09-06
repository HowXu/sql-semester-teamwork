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
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              综合教务选课系统
            </h1>
            <p className="text-xs text-muted-foreground">
              2026-2027 学年秋季学期 · 本地单机数据库
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onTabChange("timetable")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
              currentTab === "timetable"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>我的课表</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("courses")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
              currentTab === "courses"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>选课大厅</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("grades")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
              currentTab === "grades"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Award className="h-4 w-4" />
            <span>成绩与GPA</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("admin")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
              currentTab === "admin"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>教学大盘</span>
          </button>
        </nav>

        {/* Right Actions: Draft Cart & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pre-selection Cart button */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            title="查看预选车"
            aria-label="查看预选车"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">预选车</span>
            {drafts.length > 0 && (
              <Badge variant="success" className="px-1.5 py-0 text-[10px] font-mono">
                {drafts.length}
              </Badge>
            )}
          </button>

          {/* User Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-2xs hover:bg-muted transition-colors"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="text-left hidden md:block">
                <div className="leading-tight font-semibold">{currentUser.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {currentUser.studentId || currentUser.teacherId || "教务员"}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl">
                  <div className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground border-b border-border/60">
                    模拟身份无感切换 (答辩/测试专用)
                  </div>
                  <div className="py-1 space-y-1">
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
                          className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <div>
                            <div>{u.name}</div>
                            <div
                              className={`text-[10px] ${
                                isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                              }`}
                            >
                              {u.department}
                            </div>
                          </div>
                          {isActive && <span className="text-[10px] font-mono">当前</span>}
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
