import { motion } from "motion/react";
import { type ApiScheduleItem } from "@/shared/api/client";
import { ScheduleBlock } from "@/entities/schedule/ui/ScheduleBlock";
import { ConfirmModal, Button, Badge } from "@/shared/ui";
import { timetableContainerVariants } from "@/shared/lib/motion";
import { Calendar, Clock, BookOpen, RefreshCw } from "@/shared/icons";
import { useUserStore } from "@/shared/stores/useUserStore";
import { useState } from "react";

export interface TimetableGridProps {
  scheduleItems: ApiScheduleItem[];
  totalCredits: number;
  enrolledCount: number;
  onDropCourse: (item: ApiScheduleItem) => void;
  isDropping?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const DAYS = [
  { id: 1, name: "周一" },
  { id: 2, name: "周二" },
  { id: 3, name: "周三" },
  { id: 4, name: "周四" },
  { id: 5, name: "周五" },
  { id: 6, name: "周六" },
  { id: 7, name: "周日" },
];

const PERIODS = [
  { id: 1, time: "08:00 - 08:45", section: "上午" },
  { id: 2, time: "08:55 - 09:40", section: "上午" },
  { id: 3, time: "10:00 - 10:45", section: "上午" },
  { id: 4, time: "10:55 - 11:40", section: "上午" },
  { id: 5, time: "14:00 - 14:45", section: "下午" },
  { id: 6, time: "14:55 - 15:40", section: "下午" },
  { id: 7, time: "16:00 - 16:45", section: "下午" },
  { id: 8, time: "16:55 - 17:40", section: "下午" },
  { id: 9, time: "18:30 - 19:15", section: "晚上" },
  { id: 10, time: "19:25 - 20:10", section: "晚上" },
  { id: 11, time: "20:20 - 21:05", section: "晚上" },
  { id: 12, time: "21:15 - 22:00", section: "晚上" },
];

export function TimetableGrid({
  scheduleItems,
  totalCredits,
  enrolledCount,
  onDropCourse,
  isDropping = false,
  onRefresh,
  isRefreshing = false,
}: TimetableGridProps) {
  const [courseToDrop, setCourseToDrop] = useState<ApiScheduleItem | null>(null);
  const { currentUser } = useUserStore();
  const isTeacher = currentUser.role === "teacher";
  const showTeacherEmpty = isTeacher && scheduleItems.length === 0;

  return (
    <div className="space-y-4">
      {/* Top Banner with Stats & Integrated Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-2xs">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">个人学期排课表</h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              当前学期修读课程日程分布，点击卡片可查看教学地点与课程信息
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Badge variant="outline" className="px-3 py-1 text-xs font-semibold">
              <BookOpen className="h-3.5 w-3.5 text-primary mr-1" />
              <span>已修读 <strong className="text-primary font-mono">{enrolledCount}</strong> 门</span>
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-xs font-semibold">
              <Clock className="h-3.5 w-3.5 text-secondary mr-1" />
              <span>累计 <strong className="text-secondary font-mono">{totalCredits.toFixed(1)}</strong> 学分</span>
            </Badge>
          </div>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="rounded-xl text-xs font-semibold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>刷新课表</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Timetable Grid Canvas */}
      {showTeacherEmpty ? (
        <div className="rounded-2xl border border-border/80 bg-card p-10 shadow-xs text-center space-y-3">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="text-base sm:text-lg font-bold text-foreground">教师暂无选修课表</h3>
          <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto">
            当前以教师身份登录，本视图用于展示个人选修课程；教师授课课表功能将在后续迭代中开放。
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-xs no-scrollbar">
          <div className="min-w-[820px]">
            {/* Header Row: Days of Week */}
            <div className="grid grid-cols-[110px_repeat(7,1fr)] border-b border-border/80 bg-muted/40 text-center text-xs font-semibold text-muted-foreground">
              <div className="py-3 border-r border-border/60 flex items-center justify-center gap-1.5 text-foreground font-bold">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>节次 / 时段</span>
              </div>
              {DAYS.map((d) => (
                <div key={d.id} className="py-3 border-r border-border/60 last:border-r-0 font-bold text-foreground text-sm">
                  {d.name}
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="relative grid grid-cols-[110px_repeat(7,1fr)]">
              {/* Background Grid Cells & Period Timeline */}
              {PERIODS.map((period) => {
                const isSectionEnd = period.id === 4 || period.id === 8;
                return (
                  <div key={period.id} className="contents">
                    {/* Period sidebar */}
                    <div
                      className={`flex flex-col items-center justify-center border-r border-border/60 bg-card px-2 py-2 text-center transition-colors h-[68px] ${
                        isSectionEnd ? "border-b-2 border-b-border" : "border-b border-border/40"
                      }`}
                    >
                      <span className="text-xs font-bold text-foreground tracking-wide">第 {period.id} 节</span>
                      <span className="font-mono text-[11px] text-muted-foreground font-medium mt-0.5 tracking-tight">
                        {period.time}
                      </span>
                    </div>

                    {/* 7 Day cells */}
                    {DAYS.map((day) => (
                      <div
                        key={`${day.id}-${period.id}`}
                        className={`h-[68px] border-r border-border/40 last:border-r-0 hover:bg-muted/10 transition-colors ${
                          isSectionEnd ? "border-b-2 border-b-border" : "border-b border-border/30"
                        }`}
                      />
                    ))}
                  </div>
                );
              })}

              {/* Floating Course Blocks Layer */}
              <motion.div
                variants={timetableContainerVariants}
                initial="hidden"
                animate="visible"
                className="absolute inset-0 grid grid-cols-[110px_repeat(7,1fr)] grid-rows-[repeat(12,68px)] pointer-events-none p-0.5"
              >
                {scheduleItems.map((item) => {
                  const dayCol = item.dayOfWeek + 1; // Col 1 is period time column, day 1 is col 2
                  const rowStart = item.startPeriod;
                  const rowSpan = item.endPeriod - item.startPeriod + 1;

                  return (
                    <div
                      key={item.enrollmentId}
                      style={{
                        gridColumnStart: dayCol,
                        gridRowStart: rowStart,
                        gridRowEnd: `span ${rowSpan}`,
                      }}
                      className="pointer-events-auto p-1"
                    >
                      <ScheduleBlock
                        item={item}
                        onDropCourse={(c) => setCourseToDrop(c)}
                      />
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Drop Course Confirmation Modal */}
      <ConfirmModal
        isOpen={!!courseToDrop}
        onOpenChange={(open) => {
          if (!open) setCourseToDrop(null);
        }}
        title="确认退选该门课程？"
        description={`您正在申请退选【${courseToDrop?.courseName || ""}】(${courseToDrop?.courseCode || ""})。退选后相应名额将立即释放返还系统，该课程学分将不再计入课表。`}
        confirmText="确认退选"
        variant="destructive"
        isLoading={isDropping}
        onConfirm={() => {
          if (courseToDrop) {
            onDropCourse(courseToDrop);
            setCourseToDrop(null);
          }
        }}
      />
    </div>
  );
}
