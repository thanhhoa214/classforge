"use client";
import dynamic from "next/dynamic";
import { NetworkData } from "@/app/actions/network";

// Dynamically import the Sigma components with no SSR
const SigmaContainer = dynamic(
  () => import("@react-sigma/core").then((mod) => mod.SigmaContainer),
  { ssr: false }
);

const NetworkGraph = dynamic(
  () => import("./network-graph").then((mod) => mod.NetworkGraph),
  { ssr: false }
);
interface NetworkVisualizationProps {
  data: NetworkData;
}

export function NetworkVisualization({ data }: NetworkVisualizationProps) {
  return (
    <div className="w-full h-full">
      <SigmaContainer
        style={{ height: "100%", width: "100%" }}
        settings={{
          allowInvalidContainer: true,
        }}
      >
        <NetworkGraph data={data} />
      </SigmaContainer>
    </div>
  );
}
