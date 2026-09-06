import { useGradesViewModel } from "@/features/grades/model/useGradesViewModel";
import { GpaMetricCard } from "@/entities/grade/ui/GpaMetricCard";
import { Award, RefreshCw, CheckCircle2, AlertCircle } from "@/shared/icons";
import { Badge, Button, GradeDashboardSkeleton } from "@/shared/ui";

export function GradeDashboard() {
  const { state, actions } = useGradesViewModel();
  const gradesData = state.data;

  if (state.isLoading && !gradesData) {
    return <GradeDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              学业成绩与绩点查询
            </h2>
            <p className="text-xs text-muted-foreground">
              当前学生：{state.currentStudentName} ({state.currentStudentId}) · 2026-2027 学年第一学期
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={actions.refresh}
          disabled={state.isLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${state.isLoading ? "animate-spin" : ""}`} />
          <span>刷新成绩</span>
        </Button>
      </div>

      {/* GPA & Statistics Cards */}
      <GpaMetricCard
        gpa={gradesData?.gpa || 0}
        earnedCredits={gradesData?.earnedCredits || 0}
        attemptedCredits={gradesData?.attemptedCredits || 0}
        passedCount={state.passedCount}
        totalCount={state.totalCount}
      />

      {/* Grades Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">课程成绩与考核结果</h3>
          <span className="text-xs text-muted-foreground font-mono">共 {state.totalCount} 门课程</span>
        </div>

        {state.totalCount === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs">
            暂无已录入的成绩记录
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/60">
                <tr>
                  <th className="px-4 py-3 font-mono">课程号</th>
                  <th className="px-4 py-3">课程名称</th>
                  <th className="px-4 py-3 font-mono">学分</th>
                  <th className="px-4 py-3">任课教师</th>
                  <th className="px-4 py-3 font-mono">最终成绩</th>
                  <th className="px-4 py-3 font-mono">绩点 (GP)</th>
                  <th className="px-4 py-3 font-mono">等级</th>
                  <th className="px-4 py-3 text-center">考评状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {gradesData?.grades.map((g) => (
                  <tr key={g.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-secondary">
                      {g.courseCode}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {g.courseName}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {g.credits.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{g.teacherName}</td>
                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                      {g.score !== null ? g.score : "评定中"}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-primary">
                      {g.gradePoint !== null ? g.gradePoint.toFixed(2) : "--"}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">
                      <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px]">
                        {g.gradeLetter || "--"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {g.isPassed ? (
                        <Badge variant="success" className="px-2 py-0.5 text-[11px]">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>修读通过</span>
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="px-2 py-0.5 text-[11px]">
                          <AlertCircle className="h-3 w-3" />
                          <span>未达及格线</span>
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
