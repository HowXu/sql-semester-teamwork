import { motion } from "motion/react";
import { Users } from "@/shared/icons";
import { cn } from "@/shared/lib/utils";

export interface CapacityBarProps {
  current: number;
  max: number;
  className?: string;
  showDetails?: boolean;
}

export function CapacityBar({
  current,
  max,
  className,
  showDetails = true,
}: CapacityBarProps) {
  const percentage = Math.min(100, Math.round((current / (max || 1)) * 100));
  const remaining = Math.max(0, max - current);

  let toneColor = "bg-emerald-500";
  let badgeTone = "text-emerald-700 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-300";

  if (remaining === 0) {
    toneColor = "bg-rose-500";
    badgeTone = "text-rose-700 bg-rose-500/10 border-rose-500/20 dark:text-rose-300";
  } else if (percentage >= 80) {
    toneColor = "bg-amber-500";
    badgeTone = "text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-300";
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {showDetails && (
        <div className="flex items-center justify-between text-xs">
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium border text-xs",
              badgeTone
            )}
          >
            <Users className="h-3 w-3" />
            <span>
              {remaining === 0 ? "已满额" : `余量 ${remaining} / ${max}`}
            </span>
          </div>
          <span className="font-mono text-muted-foreground">{percentage}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn("h-full rounded-full transition-colors", toneColor)}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
        />
      </div>
    </div>
  );
}
