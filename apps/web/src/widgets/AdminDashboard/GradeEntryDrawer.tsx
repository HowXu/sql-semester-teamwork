import { useState, useEffect, useMemo } from "react";
import { type ApiOffering, type ApiOfferingRosterResponse } from "@/shared/api/client";
import {
  X,
  Award,
  Users,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  Search,
  Clock,
} from "lucide-react";
import { Badge, Button } from "@/shared/ui";

export interface GradeEntryDrawerProps {
  offering: ApiOffering | null;
  roster: ApiOfferingRosterResponse | null;
  isLoading: boolean;
  isSubmitting: boolean;
  feedbackMessage: { type: "success" | "error"; text: string } | null;
  onClose: () => void;
  onSubmitGrade: (enrollmentId: string, score: number) => void;
  onBatchPresetGrades: (students: ApiOfferingRosterResponse["students"]) => void;
}

export type GradeSortOrder = "default" | "graded-first" | "unassigned-first";

export function GradeEntryDrawer({
  offering,
  roster,
  isLoading,
  isSubmitting,
  feedbackMessage,
  onClose,
  onSubmitGrade,
  onBatchPresetGrades,
}: GradeEntryDrawerProps) {
  // Local score edits map: enrollmentId -> string input
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<GradeSortOrder>("default");
  const [searchQuery, setSearchQuery] = useState("");

  const students = roster?.students ?? [];
  const gradedCount = students.filter((s) => s.score !== null).length;
  const unassignedCount = students.length - gradedCount;

  // Sync inputs from roster when loaded
  useEffect(() => {
    if (roster?.students) {
      const init: Record<string, string> = {};
      roster.students.forEach((s) => {
        init[s.enrollmentId] = s.score !== null ? String(s.score) : "";
      });
      setScoreInputs(init);
    }
  }, [roster]);

  // Filter and sort students (called unconditionally)
  const displayStudents = useMemo(() => {
    let list = [...students];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.studentNo.toLowerCase().includes(q) ||
          s.realName.toLowerCase().includes(q) ||
          s.className.toLowerCase().includes(q)
      );
    }

    if (sortOrder === "graded-first") {
      // 已完成评分排在上面，未评分排在下面
      list.sort((a, b) => {
        const aGraded = a.score !== null;
        const bGraded = b.score !== null;
        if (aGraded && !bGraded) return -1;
        if (!aGraded && bGraded) return 1;
        if (aGraded && bGraded) {
          return (b.score ?? 0) - (a.score ?? 0); // 分数高到低
        }
        return a.studentNo.localeCompare(b.studentNo);
      });
    } else if (sortOrder === "unassigned-first") {
      // 待评分排在上面，已评分排在下面
      list.sort((a, b) => {
        const aGraded = a.score !== null;
        const bGraded = b.score !== null;
        if (!aGraded && bGraded) return -1;
        if (aGraded && !bGraded) return 1;
        return a.studentNo.localeCompare(b.studentNo);
      });
    } else {
      // 默认按学号排序
      list.sort((a, b) => a.studentNo.localeCompare(b.studentNo));
    }

    return list;
  }, [students, sortOrder, searchQuery]);

  const handleScoreChange = (enrollmentId: string, val: string) => {
    setScoreInputs((prev) => ({ ...prev, [enrollmentId]: val }));
  };

  const handleSaveSingle = (enrollmentId: string) => {
    const rawVal = scoreInputs[enrollmentId];
    if (rawVal === undefined || rawVal.trim() === "") return;
    const num = Number(rawVal);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      alert("请输入 0 到 100 之间的有效数字成绩");
      return;
    }
    setEditingId(enrollmentId);
    onSubmitGrade(enrollmentId, num);
  };

  const computeGradeLetter = (score: number | null) => {
    if (score === null) return "--";
    if (score >= 90) return "A";
    if (score >= 85) return "A-";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "B-";
    if (score >= 60) return "C";
    return "F";
  };

  const computeGradePoint = (score: number | null) => {
    if (score === null) return "--";
    if (score < 60) return "0.00";
    return Math.min(5.0, Number(((score - 50) / 10).toFixed(2))).toFixed(2);
  };

  if (!offering) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-50 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  【{offering.courseName}】选课学生成绩评定
                </h3>
                <Badge variant="outline" className="font-mono text-xs">
                  {offering.courseCode}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                授课教师：{offering.teacherName} · 开课学期：{offering.semester} · 当前选修：
                <strong className="text-foreground font-mono">{students.length}</strong> 人
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {unassignedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBatchPresetGrades(students)}
                disabled={isSubmitting || isLoading}
                className="rounded-xl text-xs font-semibold gap-1.5 border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary"
                title="自动为尚未录入成绩的学生快速生成 80~97 分的演示成绩"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>一键填充演示成绩 ({unassignedCount})</span>
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="关闭窗口"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-semibold border-b ${
              feedbackMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-3 border-b border-border/70 bg-card px-6 py-3 text-center text-xs">
          <div>
            <span className="text-muted-foreground">已选学生总数</span>
            <div className="mt-0.5 font-mono text-base font-bold text-foreground">
              {students.length}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">已完成成绩录入</span>
            <div className="mt-0.5 font-mono text-base font-bold text-emerald-600">
              {gradedCount}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">待录入评分</span>
            <div className="mt-0.5 font-mono text-base font-bold text-primary">
              {unassignedCount}
            </div>
          </div>
        </div>

        {/* Toolbar: Sort Order Controls & Quick Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-2.5 border-b border-border/70 bg-muted/15 text-xs">
          {/* Sorting Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground font-medium mr-1 flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>成绩排布：</span>
            </span>
            <button
              type="button"
              onClick={() => setSortOrder("default")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                sortOrder === "default"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              默认按学号
            </button>
            <button
              type="button"
              onClick={() => setSortOrder("graded-first")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all flex items-center gap-1 ${
                sortOrder === "graded-first"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
              title="已完成评分的学生排在上面，未评分学生排在下面"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>已评分排上面 (已评置顶)</span>
            </button>
            <button
              type="button"
              onClick={() => setSortOrder("unassigned-first")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all flex items-center gap-1 ${
                sortOrder === "unassigned-first"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
              title="未评分学生排在上面，已评分学生排在下面"
            >
              <Clock className="h-3 w-3" />
              <span>未评分排上面 (已评排下面)</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索学号 / 姓名..."
              className="w-full rounded-lg border border-border bg-background pl-8 pr-7 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Student Roster Table Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs">正在加载教学班学生花名册与成绩记录...</p>
            </div>
          ) : displayStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 text-muted-foreground">
              <Users className="h-10 w-10 stroke-[1.5]" />
              <p className="text-sm font-semibold text-foreground">
                {students.length === 0 ? "暂无学生选修本教学班" : "未找到匹配的学生记录"}
              </p>
              <p className="text-xs">
                {students.length === 0
                  ? "学生在选课大厅选修该课程后，将在此处自动呈现并支持成绩录入。"
                  : "请尝试清空搜索关键词或更换排布方式。"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/80 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3 font-mono">学号</th>
                    <th className="px-4 py-3">学生姓名</th>
                    <th className="px-4 py-3">学院 / 班级</th>
                    <th className="px-4 py-3 font-mono w-36">录入成绩 (0~100)</th>
                    <th className="px-4 py-3 font-mono text-center">折算绩点</th>
                    <th className="px-4 py-3 text-center">等级</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {displayStudents.map((stu) => {
                    const currentInput = scoreInputs[stu.enrollmentId] ?? "";
                    const numericInput = currentInput === "" ? null : Number(currentInput);
                    const letter = computeGradeLetter(numericInput);
                    const gp = computeGradePoint(numericInput);
                    const isSavingThis = isSubmitting && editingId === stu.enrollmentId;

                    return (
                      <tr key={stu.enrollmentId} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-secondary">
                          {stu.studentNo}
                        </td>
                        <td className="px-4 py-3 font-bold text-foreground">
                          {stu.realName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {stu.department} · {stu.className}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={currentInput}
                              onChange={(e) => handleScoreChange(stu.enrollmentId, e.target.value)}
                              placeholder="未录入"
                              className="w-24 rounded-lg border border-border bg-background px-2.5 py-1 font-mono text-xs font-bold text-foreground shadow-2xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <span className="text-[11px] text-muted-foreground font-medium">分</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-primary text-center">
                          {gp}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {numericInput !== null ? (
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold font-mono ${
                                numericInput >= 60
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : "bg-destructive/15 text-destructive"
                              }`}
                            >
                              {letter}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">未评定</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isSavingThis || isSubmitting || currentInput.trim() === ""}
                            onClick={() => handleSaveSingle(stu.enrollmentId)}
                            className="rounded-lg text-xs font-semibold px-3 py-1 gap-1"
                          >
                            {isSavingThis ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                            <span>{stu.score !== null ? "更新" : "保存"}</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/70 bg-muted/20 px-6 py-3 text-xs text-muted-foreground font-medium">
          <div>
            提示：录入或修改成绩后，对应学生视图中的学分与加权 GPA 将自动完成动态重算。
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}
