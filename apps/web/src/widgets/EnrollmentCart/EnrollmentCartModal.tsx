import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useCourseDraftStore, type DraftOffering } from "@/shared/stores/useCourseDraftStore";
import { useUserStore } from "@/shared/stores/useUserStore";
import { api } from "@/shared/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, X, Trash2, CheckCircle2, AlertCircle, Loader2 } from "@/shared/icons";
import { Button, Badge } from "@/shared/ui";

const WEEKDAYS = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export function EnrollmentCartModal() {
  const { drafts, isOpen, setOpen, removeDraft, clearDrafts } = useCourseDraftStore();
  const { currentUser } = useUserStore();
  const studentId = currentUser.studentId || "2024001";
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    courseName: string;
    success: boolean;
    message: string;
  }[] | null>(null);

  const totalCredits = drafts.reduce((acc, cur) => acc + cur.credit, 0);

  const handleBatchEnroll = async () => {
    setIsSubmitting(true);
    const outcomes: { courseName: string; success: boolean; message: string }[] = [];

    for (const draft of drafts) {
      try {
        const res = await api.enroll(studentId, draft.id);
        outcomes.push({
          courseName: draft.courseName,
          success: true,
          message: res.message || "选课成功",
        });
        removeDraft(draft.id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "选课失败";
        outcomes.push({
          courseName: draft.courseName,
          success: false,
          message,
        });
      }
    }

    setResults(outcomes);
    setIsSubmitting(false);

    void queryClient.invalidateQueries({ queryKey: ["offerings"] });
    void queryClient.invalidateQueries({ queryKey: ["my-schedule", studentId] });
    void queryClient.invalidateQueries({ queryKey: ["my-grades", studentId] });
    void queryClient.invalidateQueries({ queryKey: ["stats-overview"] });
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs transition-opacity duration-200" />
        <DialogPrimitive.Content className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card p-6 shadow-2xl duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-base font-semibold text-card-foreground">
                  选课预选清单 (预选车)
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs text-muted-foreground">
                  已暂存 {drafts.length} 门课程 · 累计 {totalCredits.toFixed(1)} 学分
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close asChild>
              <button className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {/* Body: List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground text-xs space-y-2">
                <ShoppingCart className="h-8 w-8 opacity-30" />
                <p>预选车当前为空</p>
                <p className="text-[11px] text-muted-foreground/80">
                  可在“选课大厅”中点击“预选车”按钮将意向课程快速暂存至此
                </p>
              </div>
            ) : (
              drafts.map((d: DraftOffering) => {
                const dayName = WEEKDAYS[d.dayOfWeek] || `周${d.dayOfWeek}`;
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/60 p-3 shadow-2xs"
                  >
                    <div className="space-y-1 truncate">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-xs font-semibold text-secondary">
                          {d.courseCode}
                        </span>
                        <h5 className="text-sm font-semibold truncate">{d.courseName}</h5>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{d.teacherName}</span>
                        <span>·</span>
                        <span className="font-mono text-primary font-medium">{d.credit}学分</span>
                        <span>·</span>
                        <span>{dayName} 第{d.startPeriod}-{d.endPeriod}节</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDraft(d.id)}
                      className="p-1 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                      title="从预选车移出"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}

            {/* Results Feedback Banner */}
            {results && (
              <div className="mt-4 rounded-xl border border-border/80 bg-muted/40 p-3 space-y-2 text-xs">
                <div className="font-semibold text-foreground">本次批量抢课结算结果：</div>
                {results.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    {r.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold">{r.courseName}</span>: {r.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border/70 pt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">拟选学生身份</span>
              <span className="font-semibold text-foreground">{currentUser.name} ({studentId})</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-1/3"
                disabled={drafts.length === 0 || isSubmitting}
                onClick={clearDrafts}
              >
                清空全部
              </Button>
              <Button
                variant="default"
                size="sm"
                className="w-2/3"
                disabled={drafts.length === 0 || isSubmitting}
                onClick={handleBatchEnroll}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>并发提交中...</span>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary" className="px-1 py-0 text-[10px] font-mono">
                      {drafts.length}
                    </Badge>
                    <span>一键批量结算选课</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
