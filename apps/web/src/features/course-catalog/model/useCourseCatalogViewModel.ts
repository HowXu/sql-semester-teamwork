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

  // Optimistic tracking sets
  const [optimisticEnrolledIds, setOptimisticEnrolledIds] = useState<Set<string>>(new Set());
  const [optimisticDroppedIds, setOptimisticDroppedIds] = useState<Set<string>>(new Set());
  const [pendingOfferingId, setPendingOfferingId] = useState<string | null>(null);

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
    const ids = new Set<string>();
    if (scheduleQuery.data?.items) {
      for (const i of scheduleQuery.data.items) {
        ids.add(i.offeringId);
      }
    }
    for (const id of optimisticEnrolledIds) ids.add(id);
    for (const id of optimisticDroppedIds) ids.delete(id);
    return ids;
  }, [scheduleQuery.data, optimisticEnrolledIds, optimisticDroppedIds]);

  // Compute time conflict helper
  const conflictMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!scheduleQuery.data?.items || !offeringsQuery.data?.offerings) return map;

    for (const offering of offeringsQuery.data.offerings) {
      if (enrolledOfferingIds.has(offering.id)) continue;
      for (const enrolled of scheduleQuery.data.items) {
        if (optimisticDroppedIds.has(enrolled.offeringId)) continue;
        if (enrolled.dayOfWeek === offering.dayOfWeek) {
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
  }, [offeringsQuery.data, scheduleQuery.data, enrolledOfferingIds, optimisticDroppedIds]);

  // Filtered offerings with optimistic capacity adjustment
  const filteredOfferings = useMemo(() => {
    if (!offeringsQuery.data?.offerings) return [];
    return offeringsQuery.data.offerings.map((o) => {
      let cap = o.currentCapacity;
      if (optimisticEnrolledIds.has(o.id) && !scheduleQuery.data?.items?.some((i) => i.offeringId === o.id)) {
        cap = Math.min(o.maxCapacity, cap + 1);
      }
      if (optimisticDroppedIds.has(o.id)) {
        cap = Math.max(0, cap - 1);
      }
      return { ...o, currentCapacity: cap };
    }).filter((o) => {
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
  }, [offeringsQuery.data, selectedDepartment, searchTerm, optimisticEnrolledIds, optimisticDroppedIds, scheduleQuery.data]);

  // All distinct departments for filter pills
  const departments = useMemo(() => {
    if (!offeringsQuery.data?.offerings) return [];
    const depts = new Set(offeringsQuery.data.offerings.map((o) => o.department));
    return Array.from(depts);
  }, [offeringsQuery.data]);

  // Enroll Mutation with instant optimistic feedback
  const enrollMutation = useMutation({
    mutationFn: (offering: ApiOffering) => {
      setPendingOfferingId(offering.id);
      setOptimisticEnrolledIds((prev) => new Set(prev).add(offering.id));
      setOptimisticDroppedIds((prev) => {
        const next = new Set(prev);
        next.delete(offering.id);
        return next;
      });
      return api.enroll(studentId, offering.id);
    },
    onSuccess: (data) => {
      setNotification({ type: "success", message: data.message });
      void queryClient.invalidateQueries({ queryKey: ["offerings"] });
      void queryClient.invalidateQueries({ queryKey: ["my-schedule", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["my-grades", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["stats-overview"] });
    },
    onError: (err: Error, offering) => {
      setOptimisticEnrolledIds((prev) => {
        const next = new Set(prev);
        next.delete(offering.id);
        return next;
      });
      setNotification({ type: "error", message: err.message });
    },
    onSettled: () => {
      setPendingOfferingId(null);
    },
  });

  // Drop Mutation with instant optimistic feedback
  const dropMutation = useMutation({
    mutationFn: (offering: ApiOffering) => {
      setPendingOfferingId(offering.id);
      setOptimisticDroppedIds((prev) => new Set(prev).add(offering.id));
      setOptimisticEnrolledIds((prev) => {
        const next = new Set(prev);
        next.delete(offering.id);
        return next;
      });
      return api.drop(studentId, offering.id);
    },
    onSuccess: (data) => {
      setNotification({ type: "success", message: data.message });
      void queryClient.invalidateQueries({ queryKey: ["offerings"] });
      void queryClient.invalidateQueries({ queryKey: ["my-schedule", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["my-grades", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["stats-overview"] });
    },
    onError: (err: Error, offering) => {
      setOptimisticDroppedIds((prev) => {
        const next = new Set(prev);
        next.delete(offering.id);
        return next;
      });
      setNotification({ type: "error", message: err.message });
    },
    onSettled: () => {
      setPendingOfferingId(null);
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
      pendingOfferingId,
      currentStudentId: studentId,
    },
    actions: {
      setSearchTerm,
      setSelectedDepartment,
      dismissNotification: () => setNotification(null),
      enrollCourse: (offering: ApiOffering) => enrollMutation.mutate(offering),
      dropCourse: (offering: ApiOffering) => dropMutation.mutate(offering),
      toggleDraft: handleToggleDraft,
    },
  };
}
