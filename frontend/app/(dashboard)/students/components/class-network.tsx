"use client";

import { getRelationshipsInClass } from "@/app/actions/network";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MousePointer2Icon } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { useProcessId } from "@/hooks/useProcessId";

const NetworkVisualization = dynamic(
  () =>
    import("./network-visualization").then((mod) => mod.NetworkVisualization),
  { ssr: false }
);

export interface ClassNetworkProps {
  classId?: number;
  className?: string;
}

export default function ClassNetwork({
  classId,
  className,
}: ClassNetworkProps) {
  const { processId } = useProcessId();
  const {
    isLoading,
    data: networkData,
    error,
  } = useQuery({
    queryKey: ["classNetwork", classId],
    queryFn: () => getRelationshipsInClass(processId || 2, classId!),
    refetchOnWindowFocus: false,
    enabled: !!classId,
  });
  return (
    <div className={cn("flex items-start border rounded-xl", className)}>
      <div className="w-full shrink-0 max-w-md aspect-square rounded-xl overflow-hidden bg-white">
        {classId ? (
          <>
            {isLoading && (
              <div className="h-full flex flex-col gap-1 items-center justify-center bg-background/80 text-muted-foreground">
                <Loader2 className="animate-spin h-6 w-6" />
                <p>Loading Network...</p>
              </div>
            )}

            {!isLoading && networkData && (
              <NetworkVisualization data={networkData} onNodeClick={() => {}} />
            )}
            {!isLoading && !networkData && !error && (
              <div className="flex items-center justify-center text-muted-foreground">
                No data available for this network type.
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col gap-1 text-center items-center justify-center bg-background/80 text-muted-foreground text-sm">
            <MousePointer2Icon className="h-6 w-6" />
            <p>Select a participant to view their class network.</p>
          </div>
        )}
      </div>

      {networkData && (
        <div className="p-6">
          <h2 className="text-lg font-semibold">Details of Class {classId}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This is a detailed view of the class&apos;s network.
          </p>
          <ul>
            <li>Total students: {networkData.nodes.length}</li>
            <li>Total edges: {networkData.edges.length}</li>
            <li>
              Average academic score:{" "}
              {formatNumber(
                networkData.students.reduce(
                  (acc, student) =>
                    acc + student.metric.properties.academic_score,
                  0
                ) / networkData.students.length
              )}
            </li>
            <li>
              Average social score:{" "}
              {formatNumber(
                networkData.students.reduce(
                  (acc, student) =>
                    acc + student.metric.properties.social_score,
                  0
                ) / networkData.students.length
              )}
            </li>
            <li>
              Average mental score:{" "}
              {formatNumber(
                networkData.students.reduce(
                  (acc, student) =>
                    acc + student.metric.properties.mental_score,
                  0
                ) / networkData.students.length
              )}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
