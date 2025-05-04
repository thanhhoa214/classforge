"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStudents } from "../../../actions/students";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StudentFilters, StudentFiltersType } from "./student-filters";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ParticipantNetwork from "../../network/components/participant-network";

export function StudentDataTable() {
  const [filters, setFilters] = useState<StudentFiltersType>({});
  const { isLoading, data } = useQuery({
    queryKey: ["students", filters],
    queryFn: async () => {
      const { students } = await getStudents();
      return students;
    },
    staleTime: Infinity,
  });
  const students = data?.filter((student) => {
    if (
      filters.house &&
      student.house.toLowerCase() !== filters.house.toLowerCase()
    ) {
      return false;
    }

    if (filters.performanceRange) {
      const performance = Number(student.perc_academic) ?? 0;
      const { min, max } = filters.performanceRange;
      if (!performance) return false;
      if (performance < min || performance > max) return false;
    }
    if (
      filters.search &&
      ![student.email, student.first_name, student.last_name]
        .join()
        .includes(filters.search)
    ) {
      return false;
    }
    return true;
  });
  const [selectedId, setSelectedId] = useState<string>();
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
                <TableHead>Email</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>House</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Academic</TableHead>
                <TableHead>Effort</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
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
                  <TableRow key={student.participant_id}>
                    <TableCell>{student.participant_id}</TableCell>
                    <TableCell>
                      {student.first_name} {student.last_name}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.completeyears}</TableCell>
                    <TableCell>{student.house}</TableCell>
                    <TableCell>{student.attendance}</TableCell>
                    <TableCell>{student.perc_academic ?? "N/A"}</TableCell>
                    <TableCell>{student.perc_effort}</TableCell>
                    <TableCell>
                      <Button
                        variant="secondary"
                        size={"iconSm"}
                        onClick={() => {
                          setSelectedId(student.participant_id);
                        }}
                      >
                        <ArrowRight />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
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
