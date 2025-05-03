"use client";
import dynamic from "next/dynamic";
import { NetworkData } from "@/app/actions/network";

// Dynamically import the Sigma components with no SSR
const SigmaContainer = dynamic(
  () => import("@react-sigma/core").then((mod) => mod.SigmaContainer),
  { ssr: false, loading: () => <p>Loading graph...</p> } // Add a loading state
);

const NetworkGraph = dynamic(
  () => import("./network-graph").then((mod) => mod.NetworkGraph),
  { ssr: false }
);
interface NetworkVisualizationProps {
  data: NetworkData;
  onNodeClick: (nodeId: string | null) => void; // Callback for node click
  onNodeHover: (nodeId: string | null) => void; // Callback for node hover
}

export function NetworkVisualization({ data, onNodeClick, onNodeHover }: NetworkVisualizationProps) {
  return (
    <div className="w-full h-full">
      <SigmaContainer
        style={{ height: "100%", width: "100%" }}
        settings={{
          allowInvalidContainer: true,
        }}
      >
        <NetworkGraph 
          data={data} 
          onNodeClick={onNodeClick} 
          onNodeHover={onNodeHover} 
        />
      </SigmaContainer>
    </div>
  );
}

// Need to import Graph constructor if NetworkGraph uses it directly
import Graph from "graphology";
