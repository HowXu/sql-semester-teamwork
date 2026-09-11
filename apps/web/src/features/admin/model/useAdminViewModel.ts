import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiOffering, type ApiOfferingRosterResponse } from "@/shared/api/client";
import { useUserStore } from "@/shared/stores/useUserStore";
import { useState, useMemo } from "react";

export function useAdminViewModel() {
  const queryClient = useQueryClient();
  const { currentUser } = useUserStore();
  const isTeacher = currentUser.role === "teacher";
  const [selectedOffering, setSelectedOffering] = useState<ApiOffering | null>(null);
  const [filterMyCoursesOnly, setFilterMyCoursesOnly] = useState<boolean>(isTeacher);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const statsQuery = useQuery({
    queryKey: ["stats-overview"],
    queryFn: () => api.getStats(),
  });

  const offeringsQuery = useQuery({
    queryKey: ["offerings"],
    queryFn: () => api.getOfferings(),
  });

  const rosterQuery = useQuery({
    queryKey: ["offering-roster", selectedOffering?.id],
    queryFn: () => (selectedOffering ? api.getOfferingGrades(selectedOffering.id) : null),
    enabled: !!selectedOffering?.id,
  });

  const submitGradeMutation = useMutation({
    mutationFn: (params: { enrollmentId: string; score: number }) => api.submitGrade(params),
    onSuccess: async (_, variables) => {
      setFeedbackMessage({
        type: "success",
        text: `成绩录入成功 (分数: ${variables.score})`,
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["offering-roster", selectedOffering?.id] }),
        queryClient.invalidateQueries({ queryKey: ["my-grades"] }),
        queryClient.invalidateQueries({ queryKey: ["stats-overview"] }),
      ]);
    },
    onError: (err) => {
      setFeedbackMessage({
        type: "error",
        text: err instanceof Error ? err.message : "成绩录入失败",
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    },
  });

  const allOfferings: ApiOffering[] = offeringsQuery.data?.offerings ?? [];

  const displayOfferings = useMemo(() => {
    if (!filterMyCoursesOnly || !isTeacher) {
      return allOfferings;
    }
    return allOfferings.filter(
      (o: ApiOffering) =>
        (currentUser.teacherId && o.teacherId === currentUser.teacherId) ||
        o.teacherName.includes(currentUser.name)
    );
  }, [allOfferings, filterMyCoursesOnly, isTeacher, currentUser.teacherId, currentUser.name]);

  return {
    state: {
      stats: statsQuery.data,
      offerings: displayOfferings,
      totalOfferingsCount: allOfferings.length,
      isLoading: statsQuery.isLoading || offeringsQuery.isLoading,
      isError: statsQuery.isError || offeringsQuery.isError,
      isTeacher,
      filterMyCoursesOnly,
      selectedOffering,
      roster: rosterQuery.data as ApiOfferingRosterResponse | null,
      isRosterLoading: rosterQuery.isLoading,
      isSubmittingGrade: submitGradeMutation.isPending,
      feedbackMessage,
    },
    actions: {
      refresh: () => {
        void statsQuery.refetch();
        void offeringsQuery.refetch();
        if (selectedOffering) {
          void rosterQuery.refetch();
        }
      },
      setFilterMyCoursesOnly,
      openGradeEntry: (offering: ApiOffering) => {
        setSelectedOffering(offering);
        setFeedbackMessage(null);
      },
      closeGradeEntry: () => {
        setSelectedOffering(null);
        setFeedbackMessage(null);
      },
      submitGrade: (enrollmentId: string, score: number) => {
        submitGradeMutation.mutate({ enrollmentId, score });
      },
      batchPresetGrades: async (students: ApiOfferingRosterResponse["students"]) => {
        if (!students || students.length === 0) return;
        const promises = students
          .filter((s) => s.score === null)
          .map((s, idx) => {
            const randomScore = 80 + ((idx * 7) % 18); // 80 ~ 97 之间高保真成绩
            return api.submitGrade({ enrollmentId: s.enrollmentId, score: randomScore });
          });
        if (promises.length === 0) {
          setFeedbackMessage({ type: "success", text: "全班所有学生成绩均已录入！" });
          setTimeout(() => setFeedbackMessage(null), 3000);
          return;
        }
        try {
          await Promise.all(promises);
          setFeedbackMessage({
            type: "success",
            text: `已为 ${promises.length} 名未评分学生批量快速生成预设成绩！`,
          });
          setTimeout(() => setFeedbackMessage(null), 4000);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["offering-roster", selectedOffering?.id] }),
            queryClient.invalidateQueries({ queryKey: ["my-grades"] }),
            queryClient.invalidateQueries({ queryKey: ["stats-overview"] }),
          ]);
        } catch {
          setFeedbackMessage({ type: "error", text: "批量成绩生成遇到部分异常" });
        }
      },
    },
  };
}
