"use client";
import { useEffect, useState } from "react";
import ParticipantNetwork from "../students/components/participant-network";
import { useStudentsApi } from "@/hooks/useStudents";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function NetworkOverview() {
  const { data, isLoading } = useStudentsApi();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (data && data.length > 0) {
      setSelectedId(data[0].participantId);
    }
  }, [data]);

  return (
    <>
      <ul>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <li
              key={index}
              className="flex items-center gap-2 cursor-pointer animate-pulse"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="w-24 h-4 bg-gray-200 animate-pulse" />
            </li>
          ))
        ) : (
          <RadioGroup
            value={selectedId?.toString()}
            onValueChange={(id) => setSelectedId(Number(id))}
            className="flex items-center gap-2 flex-wrap mb-4"
          >
            {data?.slice(0, 6).map((student) => (
              <li
                key={student.participantId}
                className="flex items-center gap-2 cursor-pointer"
              >
                {/* Checkbox */}
                <RadioGroupItem
                  id={student.participantId + ""}
                  value={student.participantId + ""}
                />
                <Label
                  htmlFor={student.participantId + ""}
                  className="text-sm font-medium"
                >
                  {student.name}
                </Label>
              </li>
            ))}
          </RadioGroup>
        )}
      </ul>

      <ParticipantNetwork
        participantIds={selectedId ? [selectedId] : []}
        showDetails={false}
        className="border-0 max-w-sm"
      />
    </>
  );
}
