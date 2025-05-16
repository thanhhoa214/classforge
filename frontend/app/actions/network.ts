import {
  MetricNode,
  neo4jDriver,
  NetworkType,
  ParticipantNode,
  RelationshipNode,
  SurveyDataNode,
} from "@/lib/neo4j";
import { Integer } from "neo4j-driver-lite";

export interface NetworkNode {
  id: number;
  label: string;
  size: number;
  color: string;
  x?: number;
  y?: number;
}

export interface NetworkEdge {
  id: string;
  source: number;
  target: number;
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
  processId: number,
  participantIds: number[]
): Promise<NetworkData> {
  const participantIdsStr =
    "[" + participantIds.map((id) => `${id}`).join(", ") + "]";
  const query = `MATCH (p1:Participant)-[r]->(p2:Participant) WHERE r.run_id = ${processId} and p1.participant_id in ${participantIdsStr} OR p2.participant_id in ${participantIdsStr} RETURN p1, r, p2`;
  const result = await neo4jDriver.executeQuery(query);

  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];

  const isSelectedParticipant = (node: ParticipantNode) =>
    participantIds.includes(node.properties.participant_id.low);

  for (const record of result.records) {
    const node1 = record.get("p1") as ParticipantNode;
    const node2 = record.get("p2") as ParticipantNode;
    const relationship = record.get("r") as RelationshipNode;

    const type = relationship.type;
    const color = NODE_COLORS[type];
    const participantColor = "#111111";
    const nonParticipantColor = "#1a4068";

    // Check if nodes already exist to avoid duplicates
    if (!nodes.some((n) => n.id === node1.properties.participant_id.low)) {
      nodes.push({
        id: node1.properties.participant_id.low,
        label: `${node1.properties.first_name} (${node1.properties.last_name})`,
        size: 1,
        color: isSelectedParticipant(node1)
          ? participantColor
          : nonParticipantColor,
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }

    if (!nodes.some((n) => n.id === node2.properties.participant_id.low)) {
      nodes.push({
        id: node2.properties.participant_id.low,
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
      source: node1.properties.participant_id.low,
      target: node2.properties.participant_id.low,
      size: 1,
      color: `${color}`,
      type: type,
    });
  }

  return { nodes, edges };
}

export async function getMetric(processId: number) {
  const query = `
  MATCH (pr:ProcessRun)-[:computed_metric]->(m:Metric) 
  WHERE pr.id = ${processId}
  RETURN m`;
  const result = await neo4jDriver.executeQuery(query);
  const { academic_score, social_score, mental_score } = result.records.reduce(
    (acc, record) => {
      const metric = record.get("m") as MetricNode;
      return {
        academic_score: acc.academic_score + metric.properties.academic_score,
        social_score: acc.social_score + metric.properties.social_score,
        mental_score: acc.mental_score + metric.properties.mental_score,
      };
    },
    { academic_score: 0, social_score: 0, mental_score: 0 }
  );
  return {
    academic_score: academic_score / result.records.length,
    social_score: social_score / result.records.length,
    mental_score: mental_score / result.records.length,
  };
}

export async function getClasses(processId: number) {
  const query = `MATCH (pr:ProcessRun {id: ${processId}})
      -[:computed_data]->(sd:SurveyData)

    RETURN DISTINCT sd.current_class
    ORDER BY sd.current_class
 `;
  const result = await neo4jDriver.executeQuery(query);
  console.log(
    result.records.map(
      (record) => (record.get("sd.current_class") as Integer).low
    )
  );

  return result.records.map(
    (record) => (record.get("sd.current_class") as Integer).low
  );
}

export async function getRelationshipsInClass(
  processId: number,
  classId: number
) {
  const query = `
MATCH (pr:ProcessRun {id: ${processId}})
  -[:computed_data]->(sd1:SurveyData {current_class: ${classId}})
  -[:has_data]->(p1:Participant)
WITH pr, sd1, p1

MATCH (pr)-[:computed_metric]->(m:Metric)-[:has_metric]->(p1)

MATCH (pr)-[:computed_data]->(sd2:SurveyData)-[:has_data]->(p2:Participant)
  WHERE sd2.current_class = sd1.current_class
    AND p2 <> p1
MATCH (p1) -[r]-> (p2)
WHERE r.run_id = ${processId}

RETURN DISTINCT
  p1,
  m AS metric,
  sd1 AS surveydata,
  r,
  p2,
  sd1.current_class AS class
LIMIT 100;`;
  const result = await neo4jDriver.executeQuery(query);
  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];

  for (const record of result.records) {
    const node1 = record.get("p1") as ParticipantNode;
    const node2 = record.get("p2") as ParticipantNode;
    const relationship = record.get("r") as RelationshipNode;

    const type = relationship.type;
    const color = NODE_COLORS[type];
    const participantColor = "#111111";

    // Check if nodes already exist to avoid duplicates
    if (!nodes.some((n) => n.id === node1.properties.participant_id.low)) {
      nodes.push({
        id: node1.properties.participant_id.low,
        label: `${node1.properties.first_name} (${node1.properties.last_name})`,
        size: 1,
        color: participantColor,
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }

    if (!nodes.some((n) => n.id === node2.properties.participant_id.low)) {
      nodes.push({
        id: node2.properties.participant_id.low,
        label: `${node2.properties.first_name} (${node2.properties.last_name})`,
        size: 1,
        color: participantColor,
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }

    // Create edges
    edges.push({
      id: relationship.elementId,
      source: node1.properties.participant_id.low,
      target: node2.properties.participant_id.low,
      size: 1,
      color: `${color}`,
      type: type,
    });
  }

  return {
    nodes,
    edges,
    students: result.records.map((record) => {
      const student = record.get("p1") as ParticipantNode;
      const metric = record.get("metric") as MetricNode;
      const surveyData = record.get("surveydata") as SurveyDataNode;
      return {
        id: student.properties.participant_id.low,
        name: `${student.properties.first_name} ${student.properties.last_name}`,
        metric,
        surveyData,
      };
    }),
  };
}

export async function getClassId(processId: number, participantId: number) {
  const query = `
  MATCH (pr:ProcessRun {id: ${processId}})
  -[:computed_data]->(sd:SurveyData)
  WHERE sd.participant_id = ${participantId}
  RETURN sd.current_class`;
  const result = await neo4jDriver.executeQuery(query);
  return (result.records[0].get("sd.current_class") as Integer).low;
}
