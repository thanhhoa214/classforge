"use client";
import { getClasses } from "@/app/actions/network";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function ClassIdSelect({
  processId,
  classId,
  onClassIdChange,
}: {
  processId: number;
  classId?: number;
  onClassIdChange: (classId: number) => void;
}) {
  const { data: classIds } = useQuery({
    queryKey: ["classes", processId],
    queryFn: () => getClasses(processId),
  });
  return (
    <Select
      value={classId?.toString()}
      onValueChange={(value) => onClassIdChange(parseInt(value))}
    >
      <SelectTrigger className="w-24">
        <SelectValue placeholder="Class" />
      </SelectTrigger>
      <SelectContent>
        {classIds?.map((classId) => (
          <SelectItem key={classId} value={classId.toString()}>
            Class {classId}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
