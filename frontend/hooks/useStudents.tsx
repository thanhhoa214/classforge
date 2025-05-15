import { useQuery } from "@tanstack/react-query";
import { useProcessId } from "./useProcessId";
import {
  neo4jDriver,
  ParticipantNode,
  MetricNode,
  SurveyDataNode,
} from "@/lib/neo4j";

export function useStudentsApi() {
  const { processId } = useProcessId();
  return useStudentsApiFromProcessId(processId);
}

export function useStudentsApiFromProcessId(processId?: number) {
  return useQuery({
    queryKey: ["students", processId],
    queryFn: async () => {
      const result = await neo4jDriver.executeQuery(`
            MATCH (pr:ProcessRun)-[]-(m:Metric)-[:has_metric {}]-(p:Participant)
            MATCH (pr)-[:computed_data]->(sd:SurveyData)-[:has_data]->(p)
            WHERE pr.id = ${processId}
            RETURN m, p, sd
        `);
      const students = result.records.map((record) => {
        const participant = (record.get("p") as ParticipantNode).properties;
        const metric = (record.get("m") as MetricNode).properties;
        const surveyData = (record.get("sd") as SurveyDataNode).properties;

        return {
          house: participant.house,
          name: `${participant.first_name} ${participant.last_name}`,
          participantId: participant.participant_id.low,
          academicScore: metric.academic_score,
          mentalScore: metric.mental_score,
          socialScore: metric.social_score,
          attendance: surveyData.attendance,
          performancePercentage: surveyData.perc_academic,
          class: surveyData.current_class.low,
          disrespect: metric.disrespect_in_degree,
          friends: metric.friends_in_degree,
          metrics: metric,
        };
      });

      return students;
    },
    staleTime: Infinity,
    enabled: !!processId,
  });
}

export type ProcessedStudent = NonNullable<
  ReturnType<typeof useStudentsApi>["data"]
>[number];
