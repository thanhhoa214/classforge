"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ProcessedStudent,
  useStudentsApiFromProcessId,
} from "@/hooks/useStudents";
import {
  BarChart,
  Bar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";
import { StudentDataTable } from "../../students/components/student-data-table";
import ParticipantNetwork from "../../students/components/participant-network";
import { formatNumber } from "@/lib/utils";
import { startCase } from "lodash-es";
import { Metric } from "@/lib/neo4j";
import { getMetric } from "@/app/actions/network";
import { useQuery } from "@tanstack/react-query";

export interface AllocationResult {
  processId: number;
  metrics: {
    academic_score: number;
    social_score: number;
    mental_score: number;
  };
}

const RadarMetric = ({ student }: { student: ProcessedStudent }) => {
  const data = [
    { metric: "Academic", value: student.academicScore },
    { metric: "Social", value: student.socialScore },
    { metric: "Mental", value: student.mentalScore },
  ];
  return (
    <RadarChart outerRadius={100} width={300} height={240} data={data}>
      <PolarGrid />
      <PolarAngleAxis dataKey="metric" />
      <PolarRadiusAxis angle={30} domain={[0, 100]} />
      <Radar
        name="Scores"
        dataKey="value"
        stroke="#3b82f6"
        fill="#3b82f6"
        fillOpacity={0.6}
      />
    </RadarChart>
  );
};

export default function PreviewPanel({ result }: { result: AllocationResult }) {
  const { data: students } = useStudentsApiFromProcessId(result.processId);
  const [selectedStudentId, setSelectedStudentId] = useState<string>();

  useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].participantId + "");
    }
  }, [students, selectedStudentId]);

  const selectedStudent = students?.find(
    (s) => s.participantId + "" === selectedStudentId
  );

  if (!result.metrics) return null;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[result.metrics]}>
              <XAxis dataKey="name" hide />
              <Tooltip formatter={(value) => formatNumber(value as number)} />
              <Legend />

              {Object.entries(result.metrics).map(([key]) => (
                <Bar
                  key={key}
                  dataKey={key as keyof Metric}
                  fill={
                    key === "academic_score"
                      ? "#10b981"
                      : key === "social_score"
                      ? "#f59e0b"
                      : "#3b82f6"
                  }
                  name={startCase(key)}
                  barSize={30}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>

          {students && (
            <StudentDataTable
              processId={result.processId}
              className="flex-col mt-4"
              onSelectedIdChange={(id) =>
                setSelectedStudentId(id ? id + "" : undefined)
              }
            />
          )}
        </CardContent>
      </Card>
      {selectedStudent && (
        <Card>
          <CardHeader>
            {students && students.length > 0 && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedStudent.name} (#{selectedStudent.participantId})
                </h2>
                <p className="text-muted-foreground">
                  This student has been allocated to group{" "}
                  {selectedStudent.house} with a score of{" "}
                  {formatNumber(selectedStudent.academicScore)} in academics,{" "}
                  {formatNumber(selectedStudent.socialScore)} in social
                  interactions, and {formatNumber(selectedStudent.mentalScore)}{" "}
                  in mental well-being.
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex flex-col gap-2">
                <div className="flex justify-center items-end bg-white rounded-lg border grow min-w-80 aspect-square">
                  <RadarMetric student={selectedStudent} />
                </div>
                <p className="text-center text-sm text-muted-foreground mt-1">
                  Student Scores
                </p>
              </div>
              <div>
                <ParticipantNetwork
                  participantIds={[selectedStudent.participantId]}
                  showDetails={false}
                  className="min-w-80 min-h-80"
                />
                <p className="text-center text-sm text-muted-foreground mt-1">
                  Student Relationships
                </p>
              </div>
            </div>

            <h3 className="text-center text-lg font-semibold mt-4">
              Detail Metrics
            </h3>
            <ul className="grid grid-cols-3 gap-x-8 w-full mt-2 border-2 rounded-lg p-2">
              {Object.entries(selectedStudent.metrics).map(([key, value]) => (
                <li
                  key={key}
                  className="flex justify-between items-center gap-1 text-muted-foreground"
                >
                  <span>{startCase(key)}:</span>
                  <strong className="font-semibold">
                    {formatNumber(
                      typeof value === "number" ? value : value.low
                    )}
                  </strong>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const useAllocationResult: (processId?: number) => {
  data?: AllocationResult;
  isLoading: boolean;
} = (processId) => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["allocation-result", processId],
    queryFn: () => getMetric(processId!),
    enabled: !!processId,
  });

  return {
    data: processId && metrics ? { processId, metrics } : undefined,
    isLoading: isLoading,
  };
};
