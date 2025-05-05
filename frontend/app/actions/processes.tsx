import { neo4jDriver } from "@/lib/neo4j";

export async function getLatestProcessId() {
  const query = `MATCH (pr:ProcessRun)
WITH pr.id AS runId
ORDER BY runId DESC
LIMIT 1
RETURN runId`;
  const result = await neo4jDriver.executeQuery(query);
  const processId = result.records[0].get("runId");
  return processId as number;
}
