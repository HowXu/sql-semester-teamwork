import { useAdminViewModel } from "@/features/admin/model/useAdminViewModel";
import {
  BarChart3,
  Database,
  Users,
  BookOpen,
  RefreshCw,
  Award,
  Layers,
} from "@/shared/icons";
import { Button, CapacityBar, AdminDashboardSkeleton } from "@/shared/ui";
import { GradeEntryDrawer } from "./GradeEntryDrawer";

export function AdminDashboard() {
  const { state, actions } = useAdminViewModel();
  const stats = state.stats;

  if (state.isLoading && !stats) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {state.isTeacher ? "教师教学与成绩管理大盘" : "全校教学运行数据总览"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {state.isTeacher
                ? "查看主讲教学班学生选课花名册、进行课程考核成绩录入与加权绩点折算"
                : "全校开课与选课容量统计、各教学班学生选课花名册与成绩评定管理"}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={actions.refresh}
          disabled={state.isLoading}
          className="rounded-xl text-xs font-semibold"
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

      {/* Teaching Offerings & Grade Management Section */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                教学班学生名单与成绩评定管理
              </h3>
              <p className="text-xs text-muted-foreground">
                点击对应教学班的【录入/管理成绩】即可调出学生名单并修改分数
              </p>
            </div>
          </div>

          {state.isTeacher && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => actions.setFilterMyCoursesOnly(true)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  state.filterMyCoursesOnly
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                我主讲的教学班
              </button>
              <button
                type="button"
                onClick={() => actions.setFilterMyCoursesOnly(false)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  !state.filterMyCoursesOnly
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                全部教学班 ({state.totalOfferingsCount})
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/60">
              <tr>
                <th className="px-4 py-3 font-mono">课程号</th>
                <th className="px-4 py-3">教学班课程名称</th>
                <th className="px-4 py-3">开课学院</th>
                <th className="px-4 py-3">主讲教师</th>
                <th className="px-4 py-3 font-mono">学分</th>
                <th className="px-4 py-3">上课地点</th>
                <th className="px-4 py-3 w-40">选课容量进度</th>
                <th className="px-4 py-3 text-right">成绩管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {state.offerings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    暂无可管理的教学班记录
                  </td>
                </tr>
              ) : (
                state.offerings.map((off) => (
                  <tr key={off.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-secondary">
                      {off.courseCode}
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      {off.courseName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{off.department}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{off.teacherName}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {off.credits.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{off.classroom}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[11px] font-bold">
                          <span className="text-foreground">{off.currentCapacity}</span>
                          <span className="text-muted-foreground">/ {off.maxCapacity}</span>
                        </div>
                        <CapacityBar
                          current={off.currentCapacity}
                          max={off.maxCapacity}
                          className="h-1.5"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => actions.openGradeEntry(off)}
                        className="rounded-xl text-xs font-semibold gap-1.5 px-3 py-1.5"
                      >
                        <Award className="h-3.5 w-3.5 text-primary" />
                        <span>成绩录入 / 名单</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border/80 flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">各学院开课与选课统计</h3>
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
              {(stats?.departmentStats ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    暂无开课学院统计记录
                  </td>
                </tr>
              ) : (
                (stats?.departmentStats ?? []).map((dept) => (
                  <tr key={dept.department} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{dept.department}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{dept.courseCount}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{dept.offeringCount}</td>
                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                      {dept.enrollmentCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Entry Modal / Drawer */}
      <GradeEntryDrawer
        offering={state.selectedOffering}
        roster={state.roster}
        isLoading={state.isRosterLoading}
        isSubmitting={state.isSubmittingGrade}
        feedbackMessage={state.feedbackMessage}
        onClose={actions.closeGradeEntry}
        onSubmitGrade={actions.submitGrade}
        onBatchPresetGrades={actions.batchPresetGrades}
      />
    </div>
  );
}

