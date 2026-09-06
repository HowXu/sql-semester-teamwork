import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiScheduleItem } from "@/shared/api/client";
import { useUserStore } from "@/shared/stores/useUserStore";

export function useTimetableViewModel() {
  const queryClient = useQueryClient();
  const { currentUser } = useUserStore();
  const studentId = currentUser.studentId || "2024001";

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
    onSuccess: (data) => {
      setNotification({ type: "success", message: data.message });
      setCourseToDrop(null);
      void queryClient.invalidateQueries({ queryKey: ["my-schedule", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["offerings"] });
      void queryClient.invalidateQueries({ queryKey: ["my-grades", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["stats-overview"] });
    },
    onError: (err: Error) => {
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
