import { motion } from "motion/react";
import { type ApiScheduleItem } from "@/shared/api/client";
import { MapPin, User, Trash2 } from "@/shared/icons";
import { timetableCellVariants } from "@/shared/lib/motion";

export interface ScheduleBlockProps {
  item: ApiScheduleItem;
  onDropCourse?: (item: ApiScheduleItem) => void;
}

const COLOR_PALETTES = [
  "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100",
  "bg-teal-500/10 border-teal-500/30 text-teal-950 dark:text-teal-100",
  "bg-lime-500/10 border-lime-500/30 text-lime-950 dark:text-lime-100",
  "bg-sky-500/10 border-sky-500/30 text-sky-950 dark:text-sky-100",
  "bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-100",
  "bg-violet-500/10 border-violet-500/30 text-violet-950 dark:text-violet-100",
];

export function ScheduleBlock({ item, onDropCourse }: ScheduleBlockProps) {
  // Simple hash for consistent pastel coloring per course code
  let hash = 0;
  for (let i = 0; i < item.courseCode.length; i++) {
    hash = (hash << 5) - hash + item.courseCode.charCodeAt(i);
  }
  const colorIndex = Math.abs(hash) % COLOR_PALETTES.length;
  const colorClass = COLOR_PALETTES[colorIndex] ?? COLOR_PALETTES[0];

  return (
    <motion.div
      variants={timetableCellVariants}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
      className={`group relative flex h-full w-full flex-col justify-between rounded-xl border p-2 text-left shadow-xs transition-shadow hover:shadow-md ${colorClass}`}
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-[11px] font-bold opacity-75">
            {item.courseCode}
          </span>
          <span className="font-mono text-[11px] font-bold text-primary">
            {item.credits}学分
          </span>
        </div>
        <h4 className="line-clamp-2 text-xs font-bold leading-snug">
          {item.courseName}
        </h4>
      </div>

      <div className="mt-1 space-y-0.5 border-t border-current/10 pt-1 text-[11px] font-medium opacity-85">
        <div className="flex items-center gap-1 truncate">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{item.classroom}</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{item.teacherName}</span>
        </div>
      </div>

      {onDropCourse && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDropCourse(item);
          }}
          className="absolute right-1.5 top-1.5 hidden rounded-md bg-destructive/10 p-1 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors group-hover:flex"
          title="退选此课程"
          aria-label="退选此课程"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
}
