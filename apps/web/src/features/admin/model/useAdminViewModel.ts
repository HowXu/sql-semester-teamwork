import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";

export function useAdminViewModel() {
  const statsQuery = useQuery({
    queryKey: ["stats-overview"],
    queryFn: () => api.getStats(),
  });

  return {
    state: {
      stats: statsQuery.data,
      isLoading: statsQuery.isLoading,
      isError: statsQuery.isError,
    },
    actions: {
      refresh: () => void statsQuery.refetch(),
    },
  };
}
