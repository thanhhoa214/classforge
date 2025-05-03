"use client";
import "@react-sigma/core/lib/style.css";
import { useEffect } from "react";
import { useLoadGraph, useSigma } from "@react-sigma/core";
import { NetworkData } from "@/app/actions/network";
import Graph from "graphology";
// Import event types if available from the library, otherwise use `any` cautiously
// import { NodeEventArgs, StageEventArgs } from "@react-sigma/core"; // Example import

interface NetworkGraphProps {
  data: NetworkData;
  onNodeClick: (nodeId: string | null) => void;
  onNodeHover: (nodeId: string | null) => void;
}

export function NetworkGraph({ data, onNodeClick, onNodeHover }: NetworkGraphProps) {
  const sigma = useSigma();
  const loadGraph = useLoadGraph();

  // Effect for loading the graph data
  useEffect(() => {
    // Ensure sigma instance is ready before manipulating graph
    if (!sigma) return;

    const graph = new Graph();

    // Add nodes
    data.nodes.forEach((node) => {
      // Use existing x/y if available, otherwise let layout handle it
      const initialX = node.x; // Let layout algorithms position if undefined
      const initialY = node.y;
      if (!graph.hasNode(node.id)) {
        graph.addNode(node.id, {
          size: node.size * 3, // Adjusted size
          color: node.color,
          x: initialX,
          y: initialY,
          originalData: node, // Store original data if needed elsewhere
        });
      }
    });

    // Add edges
    data.edges.forEach((edge) => {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        // Check if edge already exists to prevent errors
        if (!graph.hasEdge(edge.source, edge.target) && !graph.hasEdge(edge.target, edge.source)) {
          try {
            graph.addEdge(edge.source, edge.target, {
              size: edge.size,
              color: edge.color,
              label: edge.label,
              originalData: edge,
            });
          } catch (e) {
            console.warn(`Could not add edge ${edge.id} between ${edge.source} and ${edge.target}:`, e);
          }
        }
      } else {
        console.warn(`Skipping edge ${edge.id} because source or target node does not exist.`);
      }
    });

    // Load the graph into sigma
    loadGraph(graph);

    // Optional: Start layout algorithm if nodes don't have positions
    // Example using ForceAtlas2
    // if (data.nodes.some(n => n.x === undefined || n.y === undefined)) {
    //   sigma.startForceAtlas2({ iterationsPerRender: 1, linLogMode: true });
    //   setTimeout(() => sigma.stopForceAtlas2(), 3000); // Run for 3 seconds
    // }

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
      console.log('Enter Node (Graph Component):', event.node); // DEBUG LOG
      onNodeHover(event.node);
      if (container) container.style.cursor = "pointer";
    };
    const handleLeaveNode = (event: { node: string }) => {
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
