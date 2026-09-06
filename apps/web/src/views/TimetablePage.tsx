import { useTimetableViewModel } from "@/features/timetable/model/useTimetableViewModel";
import { TimetableGrid } from "@/widgets/TimetableGrid/TimetableGrid";
import { CheckCircle2, AlertCircle, X, RefreshCw } from "@/shared/icons";
import { Button, TimetableSkeleton } from "@/shared/ui";

export function TimetablePage() {
  const { state, actions } = useTimetableViewModel();
  const schedule = state.schedule;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {state.notification && (
        <div
          className={`flex items-center justify-between rounded-xl p-3 text-xs shadow-xs transition-all ${
            state.notification.type === "success"
              ? "bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 dark:text-emerald-200"
              : "bg-rose-500/10 text-rose-800 border border-rose-500/20 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {state.notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{state.notification.message}</span>
          </div>
          <button onClick={actions.dismissNotification} className="p-1 hover:opacity-75">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={actions.refresh}
          disabled={state.isLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${state.isLoading ? "animate-spin" : ""}`} />
          <span>刷新课表</span>
        </Button>
      </div>

      {state.isLoading && !schedule ? (
        <TimetableSkeleton />
      ) : (
        <TimetableGrid
          scheduleItems={schedule?.items || []}
          totalCredits={schedule?.totalCredits || 0}
          enrolledCount={schedule?.enrolledCount || 0}
          onDropCourse={actions.openDropModal}
          isDropping={state.isDropping}
        />
      )}
    </div>
  );
}
