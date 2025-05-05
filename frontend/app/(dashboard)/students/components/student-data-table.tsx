"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StudentFilters, StudentFiltersType } from "./student-filters";
import { Loader2 } from "lucide-react";
import ParticipantNetwork from "./participant-network";
import { useProcessId } from "@/hooks/useProcessId";
import { MetricNode, neo4jDriver, ParticipantNode } from "@/lib/neo4j";
import { formatNumber } from "@/lib/utils";

export function StudentDataTable() {
  const { processId } = useProcessId();

  const [filters, setFilters] = useState<StudentFiltersType>({});
  const { isLoading, data } = useQuery({
    queryKey: ["students", processId],
    queryFn: async () => {
      const result = await neo4jDriver.executeQuery(`
        MATCH (pr:ProcessRun)-[]-(m:Metric)-[:has_metric {}]-(p:Participant)
        WHERE pr.id = ${processId}
        RETURN m, p
    `);
      const students = result.records.map((record) => {
        const participant = (record.get("p") as ParticipantNode).properties;
        const metric = (record.get("m") as MetricNode).properties;
        return {
          house: participant.house,
          name: `${participant.first_name} ${participant.last_name}`,
          participantId: participant.participant_id.low,
          academicScore: metric.academic_score,
          mentalScore: metric.mental_score,
          socialScore: metric.social_score,
        };
      });

      return students;
    },
    staleTime: Infinity,
    enabled: !!processId,
  });

  const students = data?.filter((student) => {
    if (
      filters.house &&
      student.house.toLowerCase() !== filters.house.toLowerCase()
    ) {
      return false;
    }

    if (filters.performanceRange) {
      const performance = Number(student.academicScore) ?? 0;
      const { min, max } = filters.performanceRange;
      if (!performance) return false;
      if (performance < min || performance > max) return false;
    }
    if (filters.search && ![student.name].join().includes(filters.search)) {
      return false;
    }
    return true;
  });
  const [selectedId, setSelectedId] = useState<number>();

  return (
    <div className="flex gap-4">
      <div className="space-y-4 grow">
        <StudentFilters filters={filters} onFiltersChange={setFilters} />
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>House</TableHead>
                <TableHead className="text-right">Academic Score</TableHead>
                <TableHead className="text-right">Mental Score</TableHead>
                <TableHead className="text-right">Social Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <span className="inline-flex flex-col items-center justify-center gap-1">
                      <Loader2 className="animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Loading students...
                      </span>
                    </span>
                  </TableCell>
                </TableRow>
              ) : students?.length ? (
                students.map((student) => (
                  <TableRow
                    key={student.participantId}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(student.participantId)}
                  >
                    <TableCell>{student.participantId}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.house}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(student.academicScore)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(student.mentalScore)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(student.socialScore)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No students found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <ParticipantNetwork
        participantIds={selectedId ? [selectedId] : []}
        className="flex-col w-1/4"
      />
    </div>
  );
}
