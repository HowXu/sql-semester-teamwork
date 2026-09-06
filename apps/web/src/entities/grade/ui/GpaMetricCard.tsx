import { Award, BookOpen, GraduationCap, TrendingUp } from "@/shared/icons";

export interface GpaMetricCardProps {
  gpa: number;
  earnedCredits: number;
  attemptedCredits: number;
  passedCount: number;
  totalCount: number;
}

export function GpaMetricCard({
  gpa,
  earnedCredits,
  attemptedCredits,
  passedCount,
  totalCount,
}: GpaMetricCardProps) {
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>平均学分绩点 (GPA)</span>
          <Award className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
            {gpa.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground font-mono">/ 4.00</span>
        </div>
        <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          <span>学业表现优异</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>已获学分 / 修读学分</span>
          <GraduationCap className="h-4 w-4 text-secondary" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
            {earnedCredits.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            / {attemptedCredits.toFixed(1)}
          </span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          达成率 {(attemptedCredits > 0 ? (earnedCredits / attemptedCredits) * 100 : 0).toFixed(0)}%
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>已考修课程数</span>
          <BookOpen className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
            {totalCount}
          </span>
          <span className="text-xs text-muted-foreground">门课程</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          及格 {passedCount} 门
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>课程通过率</span>
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
            {passRate}%
          </span>
        </div>
        <div className="mt-2 text-xs text-emerald-600 font-medium">
          零挂科达标
        </div>
      </div>
    </div>
  );
}
