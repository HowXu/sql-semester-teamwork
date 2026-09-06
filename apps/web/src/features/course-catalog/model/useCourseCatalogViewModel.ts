import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiOffering } from "@/shared/api/client";
import { useUserStore } from "@/shared/stores/useUserStore";
import { useCourseDraftStore } from "@/shared/stores/useCourseDraftStore";

export function useCourseCatalogViewModel() {
  const queryClient = useQueryClient();
  const { currentUser } = useUserStore();
  const studentId = currentUser.studentId || "2024001";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const { drafts, addDraft, removeDraft } = useCourseDraftStore();

  // 1. Fetch available course offerings
  const offeringsQuery = useQuery({
    queryKey: ["offerings"],
    queryFn: () => api.getOfferings(),
  });

  // 2. Fetch student's current schedule to check enrolled status and conflicts
  const scheduleQuery = useQuery({
    queryKey: ["my-schedule", studentId],
    queryFn: () => api.getMySchedule(studentId),
  });

  const enrolledOfferingIds = useMemo(() => {
    if (!scheduleQuery.data?.items) return new Set<string>();
    return new Set(scheduleQuery.data.items.map((i) => i.offeringId));
  }, [scheduleQuery.data]);

  // Compute time conflict helper
  const conflictMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!scheduleQuery.data?.items || !offeringsQuery.data?.offerings) return map;

    for (const offering of offeringsQuery.data.offerings) {
      if (enrolledOfferingIds.has(offering.id)) continue;
      for (const enrolled of scheduleQuery.data.items) {
        if (enrolled.dayOfWeek === offering.dayOfWeek) {
          // Check period overlap
          const overlaps =
            Math.max(offering.startPeriod, enrolled.startPeriod) <=
            Math.min(offering.endPeriod, enrolled.endPeriod);
          if (overlaps) {
            map.set(
              offering.id,
              `与已选课程【${enrolled.courseName}】在周${offering.dayOfWeek}第${enrolled.startPeriod}-${enrolled.endPeriod}节冲突`
            );
            break;
          }
        }
      }
    }
    return map;
  }, [offeringsQuery.data, scheduleQuery.data, enrolledOfferingIds]);

  // Filtered offerings
  const filteredOfferings = useMemo(() => {
    if (!offeringsQuery.data?.offerings) return [];
    return offeringsQuery.data.offerings.filter((o) => {
      const matchDept =
        selectedDepartment === "all" || o.department === selectedDepartment;
      const lowerQ = searchTerm.toLowerCase().trim();
      const matchSearch =
        !lowerQ ||
        o.courseName.toLowerCase().includes(lowerQ) ||
        o.courseCode.toLowerCase().includes(lowerQ) ||
        o.teacherName.toLowerCase().includes(lowerQ);
      return matchDept && matchSearch;
    });
  }, [offeringsQuery.data, selectedDepartment, searchTerm]);

  // All distinct departments for filter pills
  const departments = useMemo(() => {
    if (!offeringsQuery.data?.offerings) return [];
    const depts = new Set(offeringsQuery.data.offerings.map((o) => o.department));
    return Array.from(depts);
  }, [offeringsQuery.data]);

  // Enroll Mutation
  const enrollMutation = useMutation({
    mutationFn: (offeringId: string) => api.enroll(studentId, offeringId),
    onSuccess: (data) => {
      setNotification({ type: "success", message: data.message });
      void queryClient.invalidateQueries({ queryKey: ["offerings"] });
      void queryClient.invalidateQueries({ queryKey: ["my-schedule", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["my-grades", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["stats-overview"] });
    },
    onError: (err: Error) => {
      setNotification({ type: "error", message: err.message });
    },
  });

  // Drop Mutation
  const dropMutation = useMutation({
    mutationFn: (offeringId: string) => api.drop(studentId, offeringId),
    onSuccess: (data) => {
      setNotification({ type: "success", message: data.message });
      void queryClient.invalidateQueries({ queryKey: ["offerings"] });
      void queryClient.invalidateQueries({ queryKey: ["my-schedule", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["my-grades", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["stats-overview"] });
    },
    onError: (err: Error) => {
      setNotification({ type: "error", message: err.message });
    },
  });

  const handleToggleDraft = (offering: ApiOffering) => {
    const isAlreadyDrafted = drafts.some((d) => d.id === offering.id);
    if (isAlreadyDrafted) {
      removeDraft(offering.id);
      setNotification({ type: "info", message: `已将【${offering.courseName}】从预选清单移出` });
    } else {
      addDraft({
        id: offering.id,
        courseCode: offering.courseCode,
        courseName: offering.courseName,
        credit: offering.credits,
        teacherName: offering.teacherName,
        classroom: offering.classroom,
        dayOfWeek: offering.dayOfWeek,
        startPeriod: offering.startPeriod,
        endPeriod: offering.endPeriod,
      });
      setNotification({ type: "success", message: `【${offering.courseName}】已加入预选清单` });
    }
  };

  return {
    state: {
      searchTerm,
      selectedDepartment,
      departments,
      filteredOfferings,
      totalCount: offeringsQuery.data?.offerings?.length ?? 0,
      enrolledOfferingIds,
      conflictMap,
      drafts,
      notification,
      isLoading: offeringsQuery.isLoading || scheduleQuery.isLoading,
      isActionLoading: enrollMutation.isPending || dropMutation.isPending,
      currentStudentId: studentId,
    },
    actions: {
      setSearchTerm,
      setSelectedDepartment,
      dismissNotification: () => setNotification(null),
      enrollCourse: (offering: ApiOffering) => enrollMutation.mutate(offering.id),
      dropCourse: (offering: ApiOffering) => dropMutation.mutate(offering.id),
      toggleDraft: handleToggleDraft,
    },
  };
}
