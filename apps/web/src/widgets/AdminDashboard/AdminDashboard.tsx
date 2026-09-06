import { useAdminViewModel } from "@/features/admin/model/useAdminViewModel";
import { BarChart3, Database, Users, BookOpen, RefreshCw } from "@/shared/icons";
import { Button } from "@/shared/ui";

export function AdminDashboard() {
  const { state, actions } = useAdminViewModel();
  const stats = state.stats;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              教学运行大盘与全校选课容量监控
            </h2>
            <p className="text-xs text-muted-foreground">
              实时聚合 SQLite 本地数据库中的全部开课与选修事务数据
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
          <span>刷新数据</span>
        </Button>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>基础课程总库</span>
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground">
            {stats?.totalCourses ?? "--"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">录入教学大纲课程</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>本学期开课班数</span>
            <Database className="h-4 w-4 text-secondary" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground">
            {stats?.totalOfferings ?? "--"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">已排定教室与时间的班级</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>已选人次 / 总容量</span>
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
              {stats?.totalEnrollments ?? "--"}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              / {stats?.totalCapacity ?? "--"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">学生有效选课事务总量</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>全校整体选课饱和度</span>
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold tracking-tight text-primary">
            {stats?.overallFillRate ? (stats.overallFillRate * 100).toFixed(1) : 0}%
          </div>
          <p className="mt-1 text-xs text-emerald-600 font-medium">资源容量充裕</p>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border/80">
          <h3 className="text-sm font-semibold text-foreground">各开课学院运行情况分布</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/60">
              <tr>
                <th className="px-4 py-3">学院名称</th>
                <th className="px-4 py-3 font-mono">课程数</th>
                <th className="px-4 py-3 font-mono">开设教学班</th>
                <th className="px-4 py-3 font-mono">选课人次数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {stats?.departmentStats.map((dept) => (
                <tr key={dept.department} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{dept.department}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{dept.courseCount}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{dept.offeringCount}</td>
                  <td className="px-4 py-3 font-mono font-bold text-foreground">
                    {dept.enrollmentCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
