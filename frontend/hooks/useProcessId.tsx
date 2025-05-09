import { ApiQueryClient } from "@/lib/api";
import { useSearchParams } from "next/navigation";

export function useProcessId() {
  const searchParams = useSearchParams();
  const rid = searchParams.get("rid");

  const { data, isLoading } = ApiQueryClient.useQuery(
    "get",
    "/latest-process-id",
    { refetchOnWindowFocus: false, staleTime: Infinity }
  );

  const processId = Number(rid || data?.latest_process_id) || 0;
  return { processId, isLoading };
}
