import { useCourseCatalogViewModel } from "@/features/course-catalog/model/useCourseCatalogViewModel";
import { CourseCard } from "@/entities/course/ui/CourseCard";
import { SearchInput, Badge, Button } from "@/shared/ui";
import { BookOpen, CheckCircle2, AlertCircle, Info, X } from "@/shared/icons";

export function CourseCatalog() {
  const { state, actions } = useCourseCatalogViewModel();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">全校课程选修大厅</h2>
            <p className="text-xs text-muted-foreground">
              实时并发库存校验 · 防超卖事务保障 · 先行排课冲突预检
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>当前学生学号：</span>
          <span className="font-mono font-semibold text-foreground">
            {state.currentStudentId}
          </span>
          <Badge variant="outline" className="font-mono">
            已修 {state.enrolledOfferingIds.size} 门
          </Badge>
        </div>
      </div>

      {/* Notification Toast */}
      {state.notification && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs shadow-xs transition-all ${
            state.notification.type === "success"
              ? "bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 dark:text-emerald-200"
              : state.notification.type === "error"
                ? "bg-rose-500/10 text-rose-800 border border-rose-500/20 dark:text-rose-200"
                : "bg-primary/10 text-foreground border border-primary/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {state.notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : state.notification.type === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            ) : (
              <Info className="h-4 w-4 shrink-0 text-primary" />
            )}
            <span className="font-medium">{state.notification.message}</span>
          </div>
          <button
            onClick={actions.dismissNotification}
            className="p-1 hover:opacity-75 rounded-md"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filters: Search & Department Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="w-full md:max-w-md">
          <SearchInput
            value={state.searchTerm}
            onChange={actions.setSearchTerm}
            placeholder="检索课程名称、课程代号或主讲教师..."
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <Button
            variant={state.selectedDepartment === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => actions.setSelectedDepartment("all")}
            className="rounded-full text-xs"
          >
            全部学院
          </Button>
          {state.departments.map((dept) => (
            <Button
              key={dept}
              variant={state.selectedDepartment === dept ? "default" : "outline"}
              size="sm"
              onClick={() => actions.setSelectedDepartment(dept)}
              className="rounded-full text-xs whitespace-nowrap"
            >
              {dept}
            </Button>
          ))}
        </div>
      </div>

      {/* Offerings Grid */}
      {state.filteredOfferings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center text-xs text-muted-foreground">
          <BookOpen className="h-10 w-10 opacity-30 mb-2" />
          <p>未找到符合条件的课程记录</p>
          <p className="mt-1 text-[11px] text-muted-foreground/70">
            尝试更换关键词或清除院系筛选条件
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.filteredOfferings.map((offering) => {
            const isEnrolled = state.enrolledOfferingIds.has(offering.id);
            const conflict = state.conflictMap.get(offering.id);
            const isDrafted = state.drafts.some((d) => d.id === offering.id);

            return (
              <CourseCard
                key={offering.id}
                offering={offering}
                isEnrolled={isEnrolled}
                hasTimeConflict={!!conflict}
                conflictDetails={conflict}
                isDrafted={isDrafted}
                onEnroll={actions.enrollCourse}
                onDrop={actions.dropCourse}
                onToggleDraft={actions.toggleDraft}
                isLoading={state.isActionLoading}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
