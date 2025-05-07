"use client";

import { getNeo4jData } from "@/app/actions/network";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MousePointer2Icon } from "lucide-react";
import { NetworkType } from "@/lib/neo4j";
import { cn } from "@/lib/utils";
import { useProcessId } from "@/hooks/useProcessId";

const NetworkVisualization = dynamic(
  () =>
    import("./network-visualization").then((mod) => mod.NetworkVisualization),
  { ssr: false }
);

export interface ParticipantNetworkProps {
  participantIds: number[];
  className?: string;
}

const labels: Record<NetworkType, string> = {
  has_friend: "has friend",
  has_influence: "has influence",
  get_advice: "gets advice",
  has_feedback: "has feedback",
  spend_more_time: "spends more time",
  disrespect: "disrespects",
};

export default function ParticipantNetwork({
  participantIds,
  className,
}: ParticipantNetworkProps) {
  const { processId } = useProcessId();
  const {
    isLoading,
    data: networkData,
    error,
  } = useQuery({
    queryKey: ["networkData", participantIds],
    queryFn: () => getNeo4jData(processId || 2, participantIds),
    refetchOnWindowFocus: false,
    enabled: !!participantIds.length,
  });

  return (
    <div className={cn("flex items-start border rounded-xl", className)}>
      <div className="w-full shrink-0 max-w-md aspect-square rounded-xl overflow-hidden bg-white">
        {participantIds.length > 0 ? (
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
          <div className="h-full flex flex-col gap-1 items-center justify-center bg-background/80 text-muted-foreground text-sm">
            <MousePointer2Icon className="h-6 w-6" />
            <p>Select a participant to view their network.</p>
          </div>
        )}
      </div>

      {networkData && (
        <div className="p-6">
          <h2 className="text-lg font-semibold">Network Details</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This is a detailed view of the participant&apos;s network.
          </p>
          <ul>
            {networkData?.nodes.map((node) => {
              const edges = networkData.edges.filter(
                (edge) => edge.source === node.id
              );

              if (participantIds.includes(node.id)) return null;
              return (
                <li key={node.id} className="flex flex-col gap-2 mb-3">
                  <strong className="text-sm font-semibold text-muted-foreground">
                    {node.label}
                  </strong>
                  <ul className="text-xs text-muted-foreground inline-flex items-center gap-1 flex-wrap">
                    {edges.map((edge, i) => {
                      const label = labels[edge.type];
                      return (
                        <span
                          key={edge.id}
                          className="text-xs inline-flex items-center gap-1"
                        >
                          <span
                            className="w-3 h-3 inline-block rounded-full"
                            style={{ backgroundColor: `${edge.color}90` }}
                          />
                          {label}
                          {edges.length > 1 && i < edges.length - 1 ? ", " : ""}
                        </span>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
