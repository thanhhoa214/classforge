"use client";
import { useProcessId } from "@/hooks/useProcessId";
import { StudentDataTable } from "./components/student-data-table";
import ParticipantNetwork from "./components/participant-network";
import { Suspense, useState } from "react";

export default function StudentsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Student Management</h1>
      </div>
      <div className={"flex gap-4"}>
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
  return (
    <>
      <StudentDataTable
        processId={processId}
        onSelectedIdChange={setSelectedId}
      />
      <ParticipantNetwork
        participantIds={selectedId ? [selectedId] : []}
        className="flex-col w-1/4"
      />
    </>
  );
}
