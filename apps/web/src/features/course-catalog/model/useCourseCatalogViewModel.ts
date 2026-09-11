import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiOffering } from "@/shared/api/client";
import { useUserStore } from "@/shared/stores/useUserStore";
import { useCourseDraftStore } from "@/shared/stores/useCourseDraftStore";

type OfferingsCache = { offerings: ApiOffering[] };

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

  // Optimistic 集合仅用于"已修读" badge 与 conflictMap 跳过;不再影响 capacity
  const [optimisticEnrolledIds, setOptimisticEnrolledIds] = useState<Set<string>>(new Set());
  const [optimisticDroppedIds, setOptimisticDroppedIds] = useState<Set<string>>(new Set());
  const [pendingOfferingId, setPendingOfferingId] = useState<string | null>(null);

  const offeringsQuery = useQuery({
    queryKey: ["offerings"],
    queryFn: () => api.getOfferings(),
  });

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

  const conflictMap = useMemo(() => {
    const map = new Map<string, string>();
    const offerings = offeringsQuery.data?.offerings ?? [];
    if (!scheduleQuery.data?.items) return map;

    for (const offering of offerings) {
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

  // 直接读 server 真实 capacity;不再叠加乐观 ±1(避免 +2/-2 漂移)
  const filteredOfferings = useMemo(() => {
    const offerings = offeringsQuery.data?.offerings ?? [];
    return offerings
      .map((o) => ({ ...o }))
      .filter((o) => {
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

  const departments = useMemo(() => {
    const offerings = offeringsQuery.data?.offerings ?? [];
    const depts = new Set(offerings.map((o) => o.department));
    return Array.from(depts);
  }, [offeringsQuery.data]);

  // Enroll Mutation:服务端驱动缓存更新,消除 +2 漂移
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
    onMutate: async (offering: ApiOffering) => {
      await queryClient.cancelQueries({ queryKey: ["offerings"] });
      const previous = queryClient.getQueryData<OfferingsCache>(["offerings"]);
      if (previous) {
        queryClient.setQueryData<OfferingsCache>(["offerings"], (old) => ({
          offerings: (old?.offerings ?? []).map((o) =>
            o.id === offering.id
              ? {
                  ...o,
                  currentCapacity: Math.min(o.maxCapacity, o.currentCapacity + 1),
                }
              : o
          ),
        }));
      }
      return { previous };
    },
    onSuccess: (data) => {
      setNotification({ type: "success", message: data.message });
      // 只 invalidate schedule;offerings cache 已同步,无需再拉
      void queryClient.invalidateQueries({ queryKey: ["my-schedule", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["my-grades", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["stats-overview"] });
    },
    onError: (err: Error, offering, context) => {
      // 回滚 offerings cache 到 onMutate 前的状态
      if (context?.previous) {
        queryClient.setQueryData<OfferingsCache>(["offerings"], context.previous);
      }
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

  // Drop Mutation:服务端驱动缓存更新,消除 -2 漂移
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
    onMutate: async (offering: ApiOffering) => {
      await queryClient.cancelQueries({ queryKey: ["offerings"] });
      const previous = queryClient.getQueryData<OfferingsCache>(["offerings"]);
      if (previous) {
        queryClient.setQueryData<OfferingsCache>(["offerings"], (old) => ({
          offerings: (old?.offerings ?? []).map((o) =>
            o.id === offering.id
              ? { ...o, currentCapacity: Math.max(0, o.currentCapacity - 1) }
              : o
          ),
        }));
      }
      return { previous };
    },
    onSuccess: (data) => {
      setNotification({ type: "success", message: data.message });
      void queryClient.invalidateQueries({ queryKey: ["my-schedule", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["my-grades", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["stats-overview"] });
    },
    onError: (err: Error, offering, context) => {
      if (context?.previous) {
        queryClient.setQueryData<OfferingsCache>(["offerings"], context.previous);
      }
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
