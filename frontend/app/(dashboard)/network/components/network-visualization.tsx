"use client";
import { NetworkData } from "@/app/actions/network";
import { EdgeArrowProgram } from "sigma/rendering";
import {
  DEFAULT_EDGE_CURVATURE,
  EdgeCurvedArrowProgram,
  indexParallelEdgesIndex,
} from "@sigma/edge-curve";
import { SigmaContainer, useRegisterEvents } from "@react-sigma/core";
import { MultiGraph } from "graphology";
import "@react-sigma/core/lib/style.css";
import { useEffect, useMemo } from "react";

function getCurvature(index: number, maxIndex: number): number {
  if (maxIndex <= 0) throw new Error("Invalid maxIndex");
  if (index < 0) return -getCurvature(-index, maxIndex);
  const amplitude = 3.5;
  const maxCurvature =
    amplitude * (1 - Math.exp(-maxIndex / amplitude)) * DEFAULT_EDGE_CURVATURE;
  return (maxCurvature * index) / maxIndex;
}

interface NetworkVisualizationProps {
  data: NetworkData;
  onNodeClick: (nodeId: string | null) => void; // Callback for node click
}

export function NetworkVisualization({
  data,
  onNodeClick,
}: NetworkVisualizationProps) {
  const graph = useMemo(() => {
    const graph = new MultiGraph();
    data.nodes.forEach((node) => {
      graph.addNode(node.id, {
        x: node.x,
        y: node.y,
        size: 3,
        label: node.label,
        color: node.color,
      });
    });
    data.edges.forEach((edge) => {
      graph.addEdge(edge.source, edge.target, {
        size: edge.size,
        label: edge.label,
        color: edge.color,
      });
    });

    indexParallelEdgesIndex(graph, {
      edgeIndexAttribute: "parallelIndex",
      edgeMinIndexAttribute: "parallelMinIndex",
      edgeMaxIndexAttribute: "parallelMaxIndex",
    });
    graph.forEachEdge(
      (
        edge,
        {
          parallelIndex,
          parallelMinIndex,
          parallelMaxIndex,
        }:
          | {
              parallelIndex: number;
              parallelMinIndex?: number;
              parallelMaxIndex: number;
            }
          | {
              parallelIndex?: null;
              parallelMinIndex?: null;
              parallelMaxIndex?: null;
            }
      ) => {
        if (typeof parallelMinIndex === "number") {
          graph.mergeEdgeAttributes(edge, {
            type: parallelIndex ? "curved" : "straight",
            curvature: getCurvature(parallelIndex, parallelMaxIndex),
          });
        } else if (typeof parallelIndex === "number") {
          graph.mergeEdgeAttributes(edge, {
            type: "curved",
            curvature: getCurvature(parallelIndex, parallelMaxIndex),
          });
        } else {
          graph.setEdgeAttribute(edge, "type", "straight");
        }
      }
    );
    return graph;
  }, [data]);

  return (
    <div className="w-full h-full">
      <SigmaContainer
        style={{ height: "100%", width: "100%" }}
        settings={{
          allowInvalidContainer: true,
          defaultEdgeType: "straight",
          edgeProgramClasses: {
            straight: EdgeArrowProgram,
            curved: EdgeCurvedArrowProgram,
          },
        }}
        graph={graph}
      >
        <GraphEvents onNodeClick={onNodeClick} />
      </SigmaContainer>
    </div>
  );
}

// Create the Component that listen to all events
const GraphEvents: React.FC<{
  onNodeClick?: (nodeId: string | null) => void;
}> = ({ onNodeClick }) => {
  const registerEvents = useRegisterEvents();

  useEffect(() => {
    // Register the events
    registerEvents({
      // node events
      clickNode: (event) => {
        console.log("Node clicked:", event.node);

        onNodeClick?.(event.node);
      },
    });
  }, [registerEvents]);

  return null;
};
