import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiScheduleItem, type ApiScheduleResponse, type ApiOffering } from "@/shared/api/client";
import { useUserStore } from "@/shared/stores/useUserStore";

type OfferingsCache = { offerings: ApiOffering[] };

export function useTimetableViewModel() {
  const queryClient = useQueryClient();
  const { currentUser } = useUserStore();
  const studentId = currentUser.studentId || currentUser.teacherId || "20240101";

  const [courseToDrop, setCourseToDrop] = useState<ApiScheduleItem | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const scheduleQuery = useQuery({
    queryKey: ["my-schedule", studentId],
    queryFn: () => api.getMySchedule(studentId),
  });

  const dropMutation = useMutation({
    mutationFn: (offeringId: string) => api.drop(studentId, offeringId),
    onMutate: async (offeringId: string) => {
      await queryClient.cancelQueries({ queryKey: ["my-schedule", studentId] });
      await queryClient.cancelQueries({ queryKey: ["offerings"] });
      const previousSchedule = queryClient.getQueryData<ApiScheduleResponse>(["my-schedule", studentId]);
      const previousOfferings = queryClient.getQueryData<OfferingsCache>(["offerings"]);

      // 同步更新 schedule
      if (previousSchedule) {
        const nextItems = previousSchedule.items.filter((it) => it.offeringId !== offeringId);
        const nextMatrix = previousSchedule.scheduleMatrix.map((day) =>
          day.map((cell) => (cell?.offeringId === offeringId ? null : cell))
        );
        queryClient.setQueryData<ApiScheduleResponse>(["my-schedule", studentId], {
          ...previousSchedule,
          items: nextItems,
          enrolledCount: nextItems.length,
          totalCredits: nextItems.reduce((acc, it) => acc + it.credits, 0),
          scheduleMatrix: nextMatrix,
        });
      }

      // 同步更新 offerings cache:当前 offering 的 currentCapacity -1
      if (previousOfferings) {
        queryClient.setQueryData<OfferingsCache>(["offerings"], (old) => ({
          offerings: (old?.offerings ?? []).map((o) =>
            o.id === offeringId
              ? { ...o, currentCapacity: Math.max(0, o.currentCapacity - 1) }
              : o
          ),
        }));
      }

      return { previousSchedule, previousOfferings };
    },
    onSuccess: (data) => {
      setNotification({ type: "success", message: data.message });
      setCourseToDrop(null);
      // schedule 与 offerings cache 已在 onMutate 同步,这里只 invalidate grades 与 stats
      void queryClient.invalidateQueries({ queryKey: ["my-grades", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["stats-overview"] });
    },
    onError: (err: Error, _offeringId, context) => {
      if (context?.previousSchedule) {
        queryClient.setQueryData(["my-schedule", studentId], context.previousSchedule);
      }
      if (context?.previousOfferings) {
        queryClient.setQueryData<OfferingsCache>(["offerings"], context.previousOfferings);
      }
      setNotification({ type: "error", message: err.message });
    },
  });

  return {
    state: {
      schedule: scheduleQuery.data,
      isLoading: scheduleQuery.isLoading,
      isError: scheduleQuery.isError,
      courseToDrop,
      notification,
      isDropping: dropMutation.isPending,
      currentStudentName: currentUser.name,
      currentStudentId: studentId,
    },
    actions: {
      openDropModal: (item: ApiScheduleItem) => setCourseToDrop(item),
      closeDropModal: () => setCourseToDrop(null),
      confirmDrop: () => {
        if (courseToDrop) {
          dropMutation.mutate(courseToDrop.offeringId);
        }
      },
      dismissNotification: () => setNotification(null),
      refresh: () => void scheduleQuery.refetch(),
    },
  };
}
