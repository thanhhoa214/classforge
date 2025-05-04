"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { NetworkType } from "@prisma/client";
import {
  getDummyNetworkData,
  NetworkData,
  NetworkNode,
  NetworkEdge,
} from "@/app/actions/network";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NetworkTypeSelector } from "./network-type-selector";
import { NetworkVisualization } from "./network-visualization";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";

// add node interface
interface NodeDetails extends NetworkNode {
  email?: string;
  grade?: string;
  performance?: number;
  connections: {
    id: string;
    label: string;
    type: "source" | "target";
    edgeId: string;
    weight?: number;
  }[];
}

function NodeDetailPanel({
  details,
  isLoading,
}: {
  details: NodeDetails | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3 mt-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!details) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
        Click a node on the graph to see its details and connections.
      </div>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>{details.label}</CardTitle>
        <p className="text-sm text-muted-foreground">ID: {details.id}</p>
        {details.email && (
          <p className="text-sm text-muted-foreground">
            Email: {details.email}
          </p>
        )}
        {details.grade && (
          <p className="text-sm text-muted-foreground">
            Grade: {details.grade}
          </p>
        )}
        {details.performance !== undefined && (
          <p className="text-sm text-muted-foreground">
            Performance: {details.performance}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <h3 className="font-semibold mb-2 text-base">
          Connections ({details.connections.length})
        </h3>
        <ScrollArea className="h-[calc(100%-40px)] pr-3">
          {details.connections.length > 0 ? (
            <ul className="space-y-2">
              {details.connections.map((conn) => (
                <li key={conn.edgeId} className="text-sm border-b pb-1">
                  <span
                    className={
                      conn.type === "source"
                        ? "text-blue-600"
                        : "text-green-600"
                    }
                  >
                    {conn.type === "source" ? "→ To:" : "← From:"}
                  </span>
                  <span className="font-medium ml-1">{conn.label}</span>
                  {conn.weight !== undefined && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (Weight: {conn.weight})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No connections in this network type.
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function NetworkPage() {
  const searchParams = useSearchParams();
  const initialType =
    (searchParams.get("type") as NetworkType) || NetworkType.FRIENDSHIP;
  const [networkType, setNetworkType] = useState<NetworkType>(initialType);
  const [graphKey, setGraphKey] = useState(0);
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredNodeData, setHoveredNodeData] = useState<NetworkNode | null>(
    null
  );
  const [selectedNodeDetails, setSelectedNodeDetails] =
    useState<NodeDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    console.log("Network type changed to:", networkType);
    async function fetchData() {
      setLoading(true);
      setError(null);
      setSelectedNodeDetails(null);
      setHoveredNodeId(null);
      setHoveredNodeData(null);
      setNetworkData(null);
      try {
        const data = await getDummyNetworkData(networkType);
        setNetworkData(data);
        setGraphKey((prev) => prev + 1);
      } catch (err) {
        console.error("Failed to fetch network data:", err);
        setError("Failed to load network data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [networkType]);

  useEffect(() => {
    const urlType = searchParams.get("type") as NetworkType;
    if (urlType && urlType !== networkType) {
      setNetworkType(urlType);
    }
  }, [searchParams]);

  useEffect(() => {
    if (hoveredNodeId && networkData) {
      const node = networkData.nodes.find((n) => n.id === hoveredNodeId);
      setHoveredNodeData(node || null);
    } else {
      setHoveredNodeData(null);
    }
  }, [hoveredNodeId, networkData]);

  const prepareNodeDetails = useCallback(
    (nodeId: string) => {
      if (!networkData) return;
      setDetailLoading(true);
      setSelectedNodeDetails(null);

      const basicNodeData = networkData.nodes.find((n) => n.id === nodeId);
      if (!basicNodeData) {
        setDetailLoading(false);
        return;
      }

      const connections: NodeDetails["connections"] = [];
      networkData.edges.forEach((edge: NetworkEdge) => {
        let neighborId: string | null = null;
        let type: "source" | "target" | null = null;

        if (edge.source === nodeId) {
          neighborId = edge.target;
          type = "source";
        } else if (edge.target === nodeId) {
          neighborId = edge.source;
          type = "target";
        }

        if (neighborId && type) {
          const neighborNode = networkData.nodes.find(
            (n) => n.id === neighborId
          );
          if (neighborNode) {
            connections.push({
              id: neighborId,
              label: neighborNode.label,
              type,
              edgeId: edge.id,
              weight: edge.size,
            });
          }
        }
      });

      const details: NodeDetails = {
        ...basicNodeData,
        connections,
      };

      setSelectedNodeDetails(details);
      setDetailLoading(false);
    },
    [networkData]
  );

  const handleNodeClick = useCallback(
    (nodeId: string | null) => {
      // setSelectedNodeId(nodeId);
      if (nodeId) {
        prepareNodeDetails(nodeId);
      } else {
        setSelectedNodeDetails(null);
      }
    },
    [prepareNodeDetails]
  );

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Social Network Analysis</h1>

      <div className="mb-4">
        <NetworkTypeSelector
          currentType={networkType}
          onChange={(type: NetworkType) => setNetworkType(type)}
        />
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="flex-grow flex gap-4 overflow-hidden">
        <div className="flex-grow h-full border rounded-lg relative bg-muted/30">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <p>Loading Network...</p>
            </div>
          )}
          {!loading && networkData && (
            <HoverCard open={!!hoveredNodeData} openDelay={100} closeDelay={50}>
              <HoverCardTrigger asChild>
                <div className="w-full h-full">
                  <NetworkVisualization
                    key={graphKey}
                    data={networkData}
                    onNodeClick={handleNodeClick}
                    onNodeHover={handleNodeHover}
                  />
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-60 z-20" side="top" align="center">
                {hoveredNodeData && (
                  <div>
                    <h4 className="font-semibold text-sm">
                      {hoveredNodeData.label}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      ID: {hoveredNodeData.id}
                    </p>
                  </div>
                )}
              </HoverCardContent>
            </HoverCard>
          )}
          {!loading && !networkData && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              No data available for this network type.
            </div>
          )}
        </div>

        <div className="w-1/3 lg:w-1/4 h-full flex-shrink-0">
          <NodeDetailPanel
            details={selectedNodeDetails}
            isLoading={detailLoading}
          />
        </div>
      </div>
    </div>
  );
}
