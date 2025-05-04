"use client";
import { useEffect } from "react";
import { useLoadGraph, useSigma } from "@react-sigma/core";
import {
  DEFAULT_EDGE_CURVATURE,
  indexParallelEdgesIndex,
} from "@sigma/edge-curve";
import { MultiDirectedGraph } from "graphology";
import { NetworkData } from "@/app/actions/network";
// Import event types if available from the library, otherwise use `any` cautiously
// import { NodeEventArgs, StageEventArgs } from "@react-sigma/core"; // Example import

function getCurvature(index: number, maxIndex: number): number {
  if (maxIndex <= 0) throw new Error("Invalid maxIndex");
  if (index < 0) return -getCurvature(-index, maxIndex);
  const amplitude = 3.5;
  const maxCurvature =
    amplitude * (1 - Math.exp(-maxIndex / amplitude)) * DEFAULT_EDGE_CURVATURE;
  return (maxCurvature * index) / maxIndex;
}

interface NetworkGraphProps {
  data: NetworkData;
  onNodeClick: (nodeId: string | null) => void;
  onNodeHover: (nodeId: string | null) => void;
}

export function NetworkGraph({
  data,
  onNodeClick,
  onNodeHover,
}: NetworkGraphProps) {
  const sigma = useSigma();
  const loadGraph = useLoadGraph();

  // Effect for loading the graph data
  useEffect(() => {
    // Ensure sigma instance is ready before manipulating graph
    if (!sigma) return;

    const graph = new MultiDirectedGraph();

    graph.addNode("a1", { x: 0, y: 0, size: 10 });
    graph.addNode("b1", { x: 10, y: 0, size: 20 });
    graph.addNode("c1", { x: 20, y: 0, size: 10 });
    graph.addNode("d1", { x: 30, y: 0, size: 10 });
    graph.addNode("e1", { x: 40, y: 0, size: 20 });
    graph.addNode("a2", { x: 0, y: -10, size: 20 });
    graph.addNode("b2", { x: 10, y: -10, size: 10 });
    graph.addNode("c2", { x: 20, y: -10, size: 10 });
    graph.addNode("d2", { x: 30, y: -10, size: 20 });
    graph.addNode("e2", { x: 40, y: -10, size: 10 });

    // Parallel edges in the same direction:
    graph.addEdge("a1", "b1", { size: 6 });
    graph.addEdge("b1", "c1", { size: 3 });
    graph.addEdge("b1", "c1", { size: 6 });
    graph.addEdge("c1", "d1", { size: 3 });
    graph.addEdge("c1", "d1", { size: 6 });
    graph.addEdge("c1", "d1", { size: 10 });
    graph.addEdge("d1", "e1", { size: 3 });
    graph.addEdge("d1", "e1", { size: 6 });
    graph.addEdge("d1", "e1", { size: 10 });
    graph.addEdge("d1", "e1", { size: 3 });
    graph.addEdge("d1", "e1", { size: 10 });

    // Parallel edges in both directions:
    graph.addEdge("a2", "b2", { size: 3 });
    graph.addEdge("b2", "a2", { size: 6 });

    graph.addEdge("b2", "c2", { size: 6 });
    graph.addEdge("b2", "c2", { size: 10 });
    graph.addEdge("c2", "b2", { size: 3 });
    graph.addEdge("c2", "b2", { size: 3 });

    graph.addEdge("c2", "d2", { size: 3 });
    graph.addEdge("c2", "d2", { size: 6 });
    graph.addEdge("c2", "d2", { size: 6 });
    graph.addEdge("c2", "d2", { size: 10 });
    graph.addEdge("d2", "c2", { size: 3 });

    graph.addEdge("d2", "e2", { size: 3 });
    graph.addEdge("d2", "e2", { size: 3 });
    graph.addEdge("d2", "e2", { size: 3 });
    graph.addEdge("d2", "e2", { size: 6 });
    graph.addEdge("d2", "e2", { size: 10 });
    graph.addEdge("e2", "d2", { size: 3 });
    graph.addEdge("e2", "d2", { size: 3 });
    graph.addEdge("e2", "d2", { size: 6 });
    graph.addEdge("e2", "d2", { size: 6 });
    graph.addEdge("e2", "d2", { size: 10 });
    // // Add nodes
    // data.nodes.forEach((node) => {
    //   // Use existing x/y if available, otherwise let layout handle it
    //   const initialX = node.x; // Let layout algorithms position if undefined
    //   const initialY = node.y;
    //   if (!graph.hasNode(node.id)) {
    //     graph.addNode(node.id, {
    //       size: node.size * 3, // Adjusted size
    //       color: node.color,
    //       x: initialX,
    //       y: initialY,
    //       originalData: node, // Store original data if needed elsewhere
    //     });
    //   }
    // });

    // // Add edges
    // data.edges.forEach((edge) => {
    //   if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
    //     // Check if edge already exists to prevent errors
    //     if (
    //       !graph.hasEdge(edge.source, edge.target) &&
    //       !graph.hasEdge(edge.target, edge.source)
    //     ) {
    //       try {
    //         graph.addEdge(edge.source, edge.target, {
    //           size: edge.size,
    //           color: edge.color,
    //           label: edge.label,
    //           originalData: edge,
    //         });
    //       } catch (e) {
    //         console.warn(
    //           `Could not add edge ${edge.id} between ${edge.source} and ${edge.target}:`,
    //           e
    //         );
    //       }
    //     }
    //   } else {
    //     console.warn(
    //       `Skipping edge ${edge.id} because source or target node does not exist.`
    //     );
    //   }
    // });
    indexParallelEdgesIndex(graph, {
      edgeIndexAttribute: "parallelIndex",
      edgeMinIndexAttribute: "parallelMinIndex",
      edgeMaxIndexAttribute: "parallelMaxIndex",
    });

    console.log("Graph loaded:", data);

    // Load the graph into sigma

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
  }, [data, loadGraph, sigma]); // Added sigma dependency

  // Effect for registering event listeners using sigma instance
  useEffect(() => {
    // Ensure sigma instance is ready
    if (!sigma) return;

    const container = sigma.getContainer();

    // Define handlers
    const handleClickNode = (event: { node: string }) => {
      onNodeClick(event.node);
    };
    const handleEnterNode = (event: { node: string }) => {
      console.log("Enter Node (Graph Component):", event.node); // DEBUG LOG
      onNodeHover(event.node);
      if (container) container.style.cursor = "pointer";
    };
    const handleLeaveNode = () => {
      onNodeHover(null);
      if (container) container.style.cursor = "";
    };
    const handleClickStage = () => {
      // Click on the background/stage
      onNodeClick(null);
    };

    // Register listeners
    sigma.on("clickNode", handleClickNode);
    sigma.on("enterNode", handleEnterNode);
    sigma.on("leaveNode", handleLeaveNode);
    sigma.on("clickStage", handleClickStage);

    // Cleanup listeners on component unmount or when sigma/callbacks change
    return () => {
      sigma.off("clickNode", handleClickNode);
      sigma.off("enterNode", handleEnterNode);
      sigma.off("leaveNode", handleLeaveNode);
      sigma.off("clickStage", handleClickStage);
      // Reset cursor on cleanup
      if (container) container.style.cursor = "";
    };
  }, [sigma, onNodeClick, onNodeHover]); // Dependencies: sigma instance and callbacks

  // Effect for highlighting selected/hovered nodes (optional)
  useEffect(() => {
    // This is where you might add logic to visually change nodes/edges
    // based on state managed in the parent component (e.g., selectedNodeId)
    // Example:
    // sigma.setSetting('nodeReducer', (nodeId, attrs) => {
    //   if (nodeId === selectedNodeId) return { ...attrs, color: 'red', zIndex: 1 };
    //   return attrs;
    // });
  }, [sigma /*, selectedNodeId, hoveredNodeId */]); // Add parent state dependencies

  return null; // This component doesn't render DOM elements directly
}
