"use client";
import { useProcessId } from "@/hooks/useProcessId";
import { StudentDataTable } from "./components/student-data-table";
import ParticipantNetwork from "./components/participant-network";
import { useState } from "react";

export default function StudentsPage() {
  const { processId } = useProcessId();
  const [selectedId, setSelectedId] = useState<number>();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Student Management</h1>
      </div>
      <div className={"flex gap-4"}>
        <StudentDataTable
          processId={processId}
          onSelectedIdChange={setSelectedId}
        />

        <ParticipantNetwork
          participantIds={selectedId ? [selectedId] : []}
          className="flex-col w-1/4"
        />
      </div>
    </div>
  );
}
