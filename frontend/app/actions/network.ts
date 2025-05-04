"use server";

import {
  neo4jDriver,
  NetworkType,
  ParticipantNode,
  RelationshipNode,
} from "@/lib/neo4j";

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
  type: NetworkType;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

const NODE_COLORS: Record<NetworkType, string> = {
  [NetworkType.has_friend]: "#0000FF",
  [NetworkType.has_influence]: "#FF9900",
  [NetworkType.get_advice]: "#00A73E",
  [NetworkType.has_feedback]: "#E7000C",
  [NetworkType.spend_more_time]: "#0069A9",
  [NetworkType.disrespect]: "#660066",
};

export async function getNeo4jData(
  participantIds: string[]
): Promise<NetworkData> {
  const participantIdsStr =
    "[" + participantIds.map((id) => `"${id}"`).join(", ") + "]";

  const query = `MATCH (p1:Participant)-[r]-(p2:Participant) WHERE p1.participant_id in ${participantIdsStr} OR p2.participant_id in ${participantIdsStr} RETURN p1, r, p2`;
  const result = await neo4jDriver.executeQuery(query);

  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];

  const isSelectedParticipant = (node: ParticipantNode) =>
    participantIds.includes(node.properties.participant_id);

  for (const record of result.records) {
    const node1 = record.get("p1") as ParticipantNode;
    const node2 = record.get("p2") as ParticipantNode;
    const relationship = record.get("r") as RelationshipNode;

    const type = relationship.type;
    const color = NODE_COLORS[type];
    const participantColor = "#111111";
    const nonParticipantColor = "#cccccc";

    // Check if nodes already exist to avoid duplicates
    if (!nodes.some((n) => n.id === node1.properties.participant_id)) {
      nodes.push({
        id: node1.properties.participant_id,
        label: `${node1.properties.first_name} (${node1.properties.last_name})`,
        size: 1,
        color: isSelectedParticipant(node1)
          ? participantColor
          : nonParticipantColor,
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }

    if (!nodes.some((n) => n.id === node2.properties.participant_id)) {
      nodes.push({
        id: node2.properties.participant_id,
        label: `${node2.properties.first_name} (${node2.properties.last_name})`,
        size: 1,
        color: isSelectedParticipant(node2)
          ? participantColor
          : nonParticipantColor,
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }

    // Create edges
    edges.push({
      id: relationship.elementId,
      source: node1.properties.participant_id,
      target: node2.properties.participant_id,
      size: 1,
      color: `${color}`,
      type: type,
    });
  }

  return { nodes, edges };
}
