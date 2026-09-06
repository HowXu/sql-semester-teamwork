import { useCourseCatalogViewModel } from "@/features/course-catalog/model/useCourseCatalogViewModel";
import { CourseCard } from "@/entities/course/ui/CourseCard";
import { SearchInput, Badge, Button, CourseCatalogSkeleton } from "@/shared/ui";
import { BookOpen, CheckCircle2, AlertCircle, Info, X } from "@/shared/icons";

export function CourseCatalog() {
  const { state, actions } = useCourseCatalogViewModel();

  if (state.isLoading) {
    return <CourseCatalogSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">选课大厅</h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              2026-2027学年第一学期全校开课选修与教学班列表
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
          <span>当前学生：</span>
          <span className="font-mono font-bold text-foreground">
            {state.currentStudentId}
          </span>
          <Badge variant="outline" className="font-bold text-xs">
            已选 {state.enrolledOfferingIds.size} 门
          </Badge>
        </div>
      </div>

      {/* Notification Toast */}
      {state.notification && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs sm:text-sm shadow-xs transition-all ${
            state.notification.type === "success"
              ? "bg-emerald-500/10 text-emerald-800 border border-emerald-500/25 dark:text-emerald-200"
              : state.notification.type === "error"
                ? "bg-rose-500/10 text-rose-800 border border-rose-500/25 dark:text-rose-200"
                : "bg-primary/10 text-foreground border border-primary/20"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {state.notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : state.notification.type === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            ) : (
              <Info className="h-4 w-4 shrink-0 text-primary" />
            )}
            <span className="font-semibold">{state.notification.message}</span>
          </div>
          <button
            onClick={actions.dismissNotification}
            className="p-1 hover:opacity-75 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters: Search & Department Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="w-full md:max-w-md">
          <SearchInput
            value={state.searchTerm}
            onChange={actions.setSearchTerm}
            placeholder="搜索课程名称、课程代码或主讲教师..."
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs sm:text-sm">
          <Button
            variant={state.selectedDepartment === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => actions.setSelectedDepartment("all")}
            className="rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap"
          >
            全部学院 ({state.totalCount})
          </Button>
          {state.departments.map((dept) => (
            <Button
              key={dept}
              variant={state.selectedDepartment === dept ? "default" : "outline"}
              size="sm"
              onClick={() => actions.setSelectedDepartment(dept)}
              className="rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap"
            >
              {dept}
            </Button>
          ))}
        </div>
      </div>

      {/* Offerings Grid */}
      {state.filteredOfferings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground bg-card/40">
          <BookOpen className="h-10 w-10 opacity-30 mb-3" />
          <p className="font-semibold text-base">未找到符合条件的课程记录</p>
          <p className="mt-1 text-xs text-muted-foreground/80">
            请尝试更换搜索词或选择其他开课学院
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                isLoading={state.pendingOfferingId === offering.id}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
