"use server";

import { prisma } from "@/lib/prisma";
import { NetworkType } from "@prisma/client";

export interface NetworkNode {
  id: string;
  label: string;
  size: number;
  color: string;
  x?: number;
  y?: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  size: number;
  color: string;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

const NODE_COLORS = {
  [NetworkType.FRIENDSHIP]: "#4CAF50",
  [NetworkType.ADVICE]: "#2196F3",
  [NetworkType.INFLUENCE]: "#9C27B0",
  [NetworkType.DISRESPECT]: "#F44336",
};

export async function getNetworkData(type: NetworkType): Promise<NetworkData> {
  const networks = await prisma.network.findMany({ where: { type } });

  const nodes = new Map<string, NetworkNode>();
  const edges: NetworkEdge[] = [];

  networks.forEach((network) => {
    // Add source node if not exists
    if (!nodes.has(network.sourceId)) {
      nodes.set(network.sourceId, {
        id: network.sourceId,
        label: network.sourceId,
        size: 1,
        color: NODE_COLORS[type],
      });
    }

    // Add target node if not exists
    if (!nodes.has(network.targetId)) {
      nodes.set(network.targetId, {
        id: network.targetId,
        label: network.targetId,
        size: 1,
        color: NODE_COLORS[type],
      });
    }

    // Add edge
    edges.push({
      id: network.id,
      source: network.sourceId,
      target: network.targetId,
      size: network.weight || 1,
      color: NODE_COLORS[type],
    });
  });

  return {
    nodes: Array.from(nodes.values()),
    edges,
  };
}
