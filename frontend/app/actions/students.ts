import { neo4jDriver, ParticipantNode } from "@/lib/neo4j";

export async function getStudents() {
  const result = await neo4jDriver.executeQuery(
    "MATCH (n:Participant) RETURN n"
  );
  const students = result.records.map(
    (record) => (record.get("n") as ParticipantNode).properties
  );

  return { students, total: students.length };
}
