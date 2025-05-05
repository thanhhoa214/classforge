import { getLatestProcessId } from "@/app/actions/processes";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export function useProcessId() {
  const searchParams = useSearchParams();
  const rid = searchParams.get("rid");
  const { data, isLoading } = useQuery({
    queryKey: ["processId"],
    queryFn: getLatestProcessId,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const processId = Number(rid || data);
  return { processId, isLoading };
}
