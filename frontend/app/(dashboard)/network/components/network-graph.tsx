"use client";
import "@react-sigma/core/lib/style.css";
import { useEffect } from "react";
import { useLoadGraph } from "@react-sigma/core";
import { NetworkData } from "@/app/actions/network";
import Graph from "graphology";

interface NetworkGraphProps {
  data: NetworkData;
}

export function NetworkGraph({ data }: NetworkGraphProps) {
  const loadGraph = useLoadGraph();

  useEffect(() => {
    const graph = new Graph();

    // Add nodes
    data.nodes.forEach((node, index) => {
      const angle = (index * 2 * Math.PI) / data.nodes.length;
      const radius = 0.5; // Half of the container size
      graph.addNode(node.id, {
        label: node.label,
        size: node.size * 4,
        color: node.color,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    });

    // Add edges
    data.edges.forEach((edge) => {
      graph.addEdge(edge.source, edge.target, {
        size: edge.size,
        color: edge.color,
        label: edge.label,
      });
    });

    loadGraph(graph);
  }, [data, loadGraph]);

  return null;
}
