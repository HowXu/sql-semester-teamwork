import { motion } from "motion/react";
import { type ApiScheduleItem } from "@/shared/api/client";
import { ScheduleBlock } from "@/entities/schedule/ui/ScheduleBlock";
import { ConfirmModal } from "@/shared/ui";
import { timetableContainerVariants } from "@/shared/lib/motion";
import { Calendar, Clock, BookOpen } from "@/shared/icons";
import { useState } from "react";

export interface TimetableGridProps {
  scheduleItems: ApiScheduleItem[];
  totalCredits: number;
  enrolledCount: number;
  onDropCourse: (item: ApiScheduleItem) => void;
  isDropping?: boolean;
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
}: TimetableGridProps) {
  const [courseToDrop, setCourseToDrop] = useState<ApiScheduleItem | null>(null);

  return (
    <div className="space-y-4">
      {/* Top Banner with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">个人学期排课表</h2>
            <p className="text-xs text-muted-foreground">
              当前学期修读课程日程分布，点击卡片可查看教学地点与课程信息
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-foreground">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>已修课程：<strong className="text-primary">{enrolledCount}</strong> 门</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-foreground">
            <Clock className="h-3.5 w-3.5 text-secondary" />
            <span>累计学分：<strong className="text-secondary">{totalCredits.toFixed(1)}</strong> 分</span>
          </div>
        </div>
      </div>

      {/* Main Timetable Grid Canvas */}
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-xs">
        <div className="min-w-[760px]">
          {/* Header Row: Days of Week */}
          <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-border/80 bg-muted/40 text-center text-xs font-medium text-muted-foreground">
            <div className="py-2.5 border-r border-border/60">节次 / 时间</div>
            {DAYS.map((d) => (
              <div key={d.id} className="py-2.5 border-r border-border/60 last:border-r-0 font-semibold text-foreground">
                {d.name}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="relative grid grid-cols-[70px_repeat(7,1fr)]">
            {/* Background Grid Cells & Period Timeline */}
            {PERIODS.map((period) => (
              <div key={period.id} className="contents">
                {/* Period sidebar */}
                <div className="flex flex-col items-center justify-center border-b border-r border-border/60 bg-muted/20 py-2.5 text-center">
                  <span className="font-mono text-xs font-bold text-foreground">第{period.id}节</span>
                  <span className="font-mono text-[9px] text-muted-foreground scale-90">{period.time.split(" - ")[0]}</span>
                </div>

                {/* 7 Day cells */}
                {DAYS.map((day) => (
                  <div
                    key={`${day.id}-${period.id}`}
                    className="h-14 border-b border-r border-border/40 last:border-r-0 hover:bg-muted/15 transition-colors"
                  />
                ))}
              </div>
            ))}

            {/* Floating Course Blocks Layer */}
            <motion.div
              variants={timetableContainerVariants}
              initial="hidden"
              animate="visible"
              className="absolute inset-0 grid grid-cols-[70px_repeat(7,1fr)] grid-rows-[repeat(12,56px)] pointer-events-none p-0.5"
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
