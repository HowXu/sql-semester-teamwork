import { motion } from "motion/react";
import { type ApiOffering } from "@/shared/api/client";
import { CapacityBar, Button, Badge } from "@/shared/ui";
import { Clock, MapPin, User, Check, Plus, AlertTriangle, ShoppingCart } from "@/shared/icons";
import { cardInteractiveProps } from "@/shared/lib/motion";

export interface CourseCardProps {
  offering: ApiOffering;
  isEnrolled: boolean;
  hasTimeConflict: boolean;
  conflictDetails?: string | undefined;
  isDrafted: boolean;
  onEnroll: (offering: ApiOffering) => void;
  onDrop: (offering: ApiOffering) => void;
  onToggleDraft: (offering: ApiOffering) => void;
  isLoading?: boolean | undefined;
}

const WEEKDAY_NAMES = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export function CourseCard({
  offering,
  isEnrolled,
  hasTimeConflict,
  conflictDetails,
  isDrafted,
  onEnroll,
  onDrop,
  onToggleDraft,
  isLoading = false,
}: CourseCardProps) {
  const isFull = offering.currentCapacity >= offering.maxCapacity;
  const dayName = WEEKDAY_NAMES[offering.dayOfWeek] || `周${offering.dayOfWeek}`;
  const periodText = `${dayName} 第${offering.startPeriod}-${offering.endPeriod}节`;

  return (
    <motion.div
      {...cardInteractiveProps}
      className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs hover:shadow-md transition-all duration-200"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-secondary/15 px-2 py-0.5 text-xs font-mono font-bold text-secondary">
                {offering.courseCode}
              </span>
              <Badge variant="outline">{offering.department}</Badge>
              <span className="text-xs font-mono font-bold text-primary">
                {offering.credits.toFixed(1)} 学分
              </span>
            </div>
            <h3 className="text-base font-bold text-card-foreground tracking-tight pt-1">
              {offering.courseName}
            </h3>
          </div>

          {isEnrolled ? (
            <Badge variant="success" className="shrink-0 font-medium">
              <Check className="h-3.5 w-3.5" />
              <span>已修读</span>
            </Badge>
          ) : hasTimeConflict ? (
            <Badge variant="danger" className="shrink-0 font-medium" title={conflictDetails}>
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>时间冲突</span>
            </Badge>
          ) : isFull ? (
            <Badge variant="destructive" className="shrink-0 font-medium">
              <span>已满额</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0 text-muted-foreground font-medium">
              <span>可修选</span>
            </Badge>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-foreground/80 border-y border-border/50 py-2.5">
          <div className="flex items-center gap-1.5 truncate">
            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{offering.teacherName}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{offering.classroom}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="font-mono font-medium">{periodText}</span>
          </div>
        </div>

        <div className="mt-3">
          <CapacityBar current={offering.currentCapacity} max={offering.maxCapacity} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 pt-2">
        <Button
          variant={isDrafted ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onToggleDraft(offering)}
          disabled={isEnrolled || isLoading}
          title={isDrafted ? "已在预选车" : "加入预选清单"}
          className="text-xs font-medium"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>{isDrafted ? "已暂存" : "预选车"}</span>
        </Button>

        {isEnrolled ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDrop(offering)}
            disabled={isLoading}
            className="text-xs font-medium"
          >
            <span>{isLoading ? "处理中..." : "申请退选"}</span>
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => onEnroll(offering)}
            disabled={isLoading || isFull || hasTimeConflict}
            className="text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isLoading ? "选课中..." : "立即选课"}</span>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
