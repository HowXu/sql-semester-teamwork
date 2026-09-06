import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { useUserStore } from "@/shared/stores/useUserStore";

export function useGradesViewModel() {
  const { currentUser } = useUserStore();
  const studentId = currentUser.studentId || "20240101";

  const gradesQuery = useQuery({
    queryKey: ["my-grades", studentId],
    queryFn: () => api.getMyGrades(studentId),
  });

  const passedGrades =
    gradesQuery.data?.grades.filter((g) => g.isPassed === true) || [];
  const totalGrades = gradesQuery.data?.grades || [];

  return {
    state: {
      data: gradesQuery.data,
      isLoading: gradesQuery.isLoading,
      isError: gradesQuery.isError,
      passedCount: passedGrades.length,
      totalCount: totalGrades.length,
      currentStudentName: currentUser.name,
      currentStudentId: studentId,
    },
    actions: {
      refresh: () => void gradesQuery.refetch(),
    },
  };
}
