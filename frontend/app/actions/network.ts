"use server";

import { prisma } from "@/lib/prisma";
// Import Student and the Prisma-generated NetworkType
import { Student, NetworkType } from "@prisma/client";

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

const NODE_COLORS: Record<NetworkType, string> = {
  [NetworkType.FRIENDSHIP]: "#4CAF50",
  [NetworkType.ADVICE]: "#2196F3",
  [NetworkType.INFLUENCE]: "#9C27B0",
  [NetworkType.DISRESPECT]: "#F44336",
};

// --- Dummy Data Generation ---,
export async function getDummyNetworkData(type: NetworkType): Promise<NetworkData> {
    console.warn(`Returning dummy data for network type: ${type}`);
    const color = NODE_COLORS[type] || '#cccccc'; // Default color if type is somehow invalid

    // Generate 5 dummy nodes based on the network type
    const nodes: NetworkNode[] = Array.from({ length: 100 }, (_, index) => ({
        id: `s${index + 1}`,
        label: `${type} Node ${index + 1} (Dummy)`,
        size: Math.floor(Math.random() * 5) + 1, // Random size between 1 and 5
        color: color,
        x: Math.random() * 10, // Random x-coordinate
        y: Math.random() * 10, // Random y-coordinate
    }));

    // Generate edges connecting the nodes
    const edges: NetworkEdge[] = nodes.slice(0, -1).map((node, index) => ({
        id: `e${index + 1}`,
        source: node.id,
        target: nodes[index + 1].id,
        size: Math.floor(Math.random() * 3) + 1, // Random size between 1 and 3
        color: color,
    }));

    return { nodes, edges };
}

export async function getNetworkData(type: NetworkType): Promise<NetworkData> {
  try {
    const networks = await prisma.network.findMany({ where: { type } });

    // If no network data found for the type, return dummy data
    if (networks.length === 0) {
        console.log(`No network data found for type ${type}. Returning dummy data.`);
        return getDummyNetworkData(type);
    }

    // Get all unique student IDs involved in this network type
    const studentIds = new Set<string>();
    networks.forEach((network) => {
      studentIds.add(network.sourceId);
      studentIds.add(network.targetId);
    });

    // Fetch student details for these IDs
    const students = await prisma.student.findMany({
      where: {
        id: { in: Array.from(studentIds) },
      },
      select: { id: true, name: true }, // Select only necessary fields
    });

    // If no students found (e.g., network links exist but students were deleted), return dummy data
    if (students.length === 0 && networks.length > 0) {
        console.log(`Network links exist for type ${type}, but no corresponding students found. Returning dummy data.`);
        return getDummyNetworkData(type);
    }

    // Create a map for quick lookup
    const studentMap = new Map<string, Pick<Student, 'id' | 'name'>>(students.map((s) => [s.id, s]));

    const nodes = new Map<string, NetworkNode>();
    const edges: NetworkEdge[] = [];

    networks.forEach((network: any) => {
      const sourceStudent = studentMap.get(network.sourceId);
      const targetStudent = studentMap.get(network.targetId);

      // Add source node if not exists
      if (sourceStudent && !nodes.has(network.sourceId)) {
        nodes.set(network.sourceId, {
          id: network.sourceId,
          label: sourceStudent.name || network.sourceId, // Use student name as label
          size: 1,
          color: NODE_COLORS[type],
        });
      }

      // Add target node if not exists
      if (targetStudent && !nodes.has(network.targetId)) {
        nodes.set(network.targetId, {
          id: network.targetId,
          label: targetStudent.name || network.targetId, // Use student name as label
          size: 1,
          color: NODE_COLORS[type],
        });
      }

      // Add edge only if both nodes exist (handles potential data inconsistencies)
      if (sourceStudent && targetStudent) {
          edges.push({
            id: network.id,
            source: network.sourceId,
            target: network.targetId,
            size: network.weight || 1,
            color: NODE_COLORS[type],
          });
      }
    });

    // Adjust node sizes based on degree (number of connections)
    const degrees = new Map<string, number>();
    edges.forEach(edge => {
      degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
    });

    nodes.forEach(node => {
      node.size = 1 + (degrees.get(node.id) || 0); // Base size + degree
    });

    // Final check: if after processing, we have no nodes or edges, return dummy data
    const finalNodes = Array.from(nodes.values());
    if (finalNodes.length === 0 && edges.length === 0) {
        console.log(`Processed data for type ${type} resulted in empty nodes/edges. Returning dummy data.`);
        return getDummyNetworkData(type);
    }

    return {
      nodes: finalNodes,
      edges,
    };
  } catch (error) {
      console.error(`Error fetching network data for type ${type}:`, error);
      console.log(`Returning dummy data due to error.`);
      return getDummyNetworkData(type); // Return dummy data on any error
  }
}
