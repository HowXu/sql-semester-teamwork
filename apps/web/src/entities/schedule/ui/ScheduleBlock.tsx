import { motion } from "motion/react";
import { type ApiScheduleItem } from "@/shared/api/client";
import { MapPin, User, Trash2 } from "@/shared/icons";
import { timetableCellVariants } from "@/shared/lib/motion";

export interface ScheduleBlockProps {
  item: ApiScheduleItem;
  onDropCourse?: (item: ApiScheduleItem) => void;
}

interface CourseTheme {
  cardBg: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  titleColor: string;
  subColor: string;
  iconColor: string;
}

const PALETTES: CourseTheme[] = [
  {
    // 天空蓝
    cardBg: "bg-sky-50 dark:bg-sky-950/60",
    borderColor: "border-sky-300 dark:border-sky-700",
    badgeBg: "bg-sky-100 dark:bg-sky-900/80",
    badgeText: "text-sky-800 dark:text-sky-200",
    titleColor: "text-sky-950 dark:text-sky-100",
    subColor: "text-sky-900 dark:text-sky-200",
    iconColor: "text-sky-700 dark:text-sky-300",
  },
  {
    // 靛青紫
    cardBg: "bg-indigo-50 dark:bg-indigo-950/60",
    borderColor: "border-indigo-300 dark:border-indigo-700",
    badgeBg: "bg-indigo-100 dark:bg-indigo-900/80",
    badgeText: "text-indigo-800 dark:text-indigo-200",
    titleColor: "text-indigo-950 dark:text-indigo-100",
    subColor: "text-indigo-900 dark:text-indigo-200",
    iconColor: "text-indigo-700 dark:text-indigo-300",
  },
  {
    // 翡翠绿
    cardBg: "bg-emerald-50 dark:bg-emerald-950/60",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/80",
    badgeText: "text-emerald-800 dark:text-emerald-200",
    titleColor: "text-emerald-950 dark:text-emerald-100",
    subColor: "text-emerald-900 dark:text-emerald-200",
    iconColor: "text-emerald-700 dark:text-emerald-300",
  },
  {
    // 琥珀金
    cardBg: "bg-amber-50 dark:bg-amber-950/60",
    borderColor: "border-amber-300 dark:border-amber-700",
    badgeBg: "bg-amber-100 dark:bg-amber-900/80",
    badgeText: "text-amber-900 dark:text-amber-200",
    titleColor: "text-amber-950 dark:text-amber-100",
    subColor: "text-amber-900 dark:text-amber-200",
    iconColor: "text-amber-700 dark:text-amber-300",
  },
  {
    // 玫瑰青
    cardBg: "bg-rose-50 dark:bg-rose-950/60",
    borderColor: "border-rose-300 dark:border-rose-700",
    badgeBg: "bg-rose-100 dark:bg-rose-900/80",
    badgeText: "text-rose-800 dark:text-rose-200",
    titleColor: "text-rose-950 dark:text-rose-100",
    subColor: "text-rose-900 dark:text-rose-200",
    iconColor: "text-rose-700 dark:text-rose-300",
  },
  {
    // 湖水青
    cardBg: "bg-teal-50 dark:bg-teal-950/60",
    borderColor: "border-teal-300 dark:border-teal-700",
    badgeBg: "bg-teal-100 dark:bg-teal-900/80",
    badgeText: "text-teal-800 dark:text-teal-200",
    titleColor: "text-teal-950 dark:text-teal-100",
    subColor: "text-teal-900 dark:text-teal-200",
    iconColor: "text-teal-700 dark:text-teal-300",
  },
];

export function ScheduleBlock({ item, onDropCourse }: ScheduleBlockProps) {
  // 根据课程代码稳定哈希分配主题配色
  let hash = 0;
  for (let i = 0; i < item.courseCode.length; i++) {
    hash = (hash << 5) - hash + item.courseCode.charCodeAt(i);
  }
  const colorIndex = Math.abs(hash) % PALETTES.length;
  const theme = PALETTES[colorIndex] ?? PALETTES[0]!;

  const isSinglePeriod = item.endPeriod === item.startPeriod;

  return (
    <motion.div
      variants={timetableCellVariants}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
      className={`group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-xl border p-2 text-left shadow-xs transition-shadow hover:shadow-md ${theme.cardBg} ${theme.borderColor}`}
    >
      <div className="space-y-1 overflow-hidden">
        <div className="flex items-center justify-between gap-1">
          <span className={`font-mono text-xs font-bold ${theme.subColor}`}>
            {item.courseCode}
          </span>
          <span
            className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText}`}
          >
            {item.credits} 学分
          </span>
        </div>
        <h4 className={`line-clamp-2 text-xs sm:text-[13px] font-bold leading-snug ${theme.titleColor}`}>
          {item.courseName}
        </h4>
      </div>

      {!isSinglePeriod && (
        <div className={`mt-1 space-y-0.5 border-t border-black/5 dark:border-white/10 pt-1 text-xs font-medium ${theme.subColor}`}>
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className={`h-3.5 w-3.5 shrink-0 ${theme.iconColor}`} />
            <span className="truncate">{item.classroom}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <User className={`h-3.5 w-3.5 shrink-0 ${theme.iconColor}`} />
            <span className="truncate">{item.teacherName}</span>
          </div>
        </div>
      )}

      {isSinglePeriod && (
        <div className={`mt-0.5 flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-0.5 text-[11px] font-medium ${theme.subColor}`}>
          <span className="truncate">{item.classroom}</span>
          <span className="shrink-0">{item.teacherName}</span>
        </div>
      )}

      {onDropCourse && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDropCourse(item);
          }}
          className="absolute right-1.5 top-1.5 hidden rounded-md bg-destructive/15 p-1 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors group-hover:flex"
          title="退选此课程"
          aria-label="退选此课程"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
}

