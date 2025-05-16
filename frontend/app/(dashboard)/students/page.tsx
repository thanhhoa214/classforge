"use client";
import { useProcessId } from "@/hooks/useProcessId";
import { StudentDataTable } from "./components/student-data-table";
import ParticipantNetwork from "./components/participant-network";
import { Suspense, useState } from "react";
import ClassNetwork from "./components/class-network";
import { useQuery } from "@tanstack/react-query";
import { getClassId } from "@/app/actions/network";

export default function StudentsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Student Management</h1>
      </div>
      <div className={"flex flex-col gap-4"}>
        <Suspense fallback={<div>Loading...</div>}>
          <StudentsTableWithLatestProcessId />
        </Suspense>
      </div>
    </div>
  );
}
function StudentsTableWithLatestProcessId() {
  const { processId } = useProcessId();
  const [selectedId, setSelectedId] = useState<number>();
  const { data: classId } = useQuery({
    queryKey: ["classId", processId, selectedId],
    queryFn: () => getClassId(processId, selectedId!),
    enabled: !!selectedId,
  });

  return (
    <>
      <StudentDataTable
        processId={processId}
        onSelectedIdChange={setSelectedId}
      />
      <div className="flex gap-4">
        <ParticipantNetwork
          participantIds={selectedId ? [selectedId] : []}
          className="flex-col items-center w-1/2"
        />
        <ClassNetwork
          classId={classId}
          className="flex-col items-center w-1/2"
        />
      </div>
    </>
  );
}
