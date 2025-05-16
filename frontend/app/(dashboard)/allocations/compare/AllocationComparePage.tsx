"use client";

import { useEffect, useState } from "react";

import CompareProcess from "../components/compare-process";
import { useSortedProcesses } from "../components/processes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProcessId } from "@/hooks/useProcessId";

export default function AllocationComparePage() {
  const { processId } = useProcessId();

  const [processId1, setProcessId1] = useState<number>(0);
  const [processId2, setProcessId2] = useState<number>(0);

  useEffect(() => {
    setProcessId1(processId!);
    setProcessId2(processId! - 1);
  }, [processId]);

  const { data: processes } = useSortedProcesses();
  return (
    <div className="mx-auto mb-4 grid grid-cols-2 gap-4 text-center">
      <div>
        <label htmlFor="processId1" className="font-semibold mb-1 block">
          Process 1
        </label>
        <Select
          value={processId1.toString()}
          onValueChange={(value) => setProcessId1(parseInt(value))}
        >
          <SelectTrigger id="processId1" className="h-auto text-left">
            <SelectValue placeholder="Process 1" />
          </SelectTrigger>
          <SelectContent>
            {processes?.map((process) => (
              <SelectItem
                key={process.id.low}
                value={process.id.low.toString()}
              >
                <strong>Process #{process.id.low}</strong>
                <p className="text-muted-foreground text-ellipsis overflow-hidden">
                  {process.description} •{" "}
                  {new Date(process.created_at).toLocaleString()}
                </p>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor="processId2" className="font-semibold mb-1 block">
          Process 2
        </label>
        <Select
          value={processId2.toString()}
          onValueChange={(value) => setProcessId2(parseInt(value))}
        >
          <SelectTrigger id="processId2" className="h-auto text-left">
            <SelectValue placeholder="Process 2" />
          </SelectTrigger>
          <SelectContent>
            {processes?.map((process) => (
              <SelectItem
                key={process.id.low}
                value={process.id.low.toString()}
              >
                <strong>Process #{process.id.low}</strong>
                <p className="text-muted-foreground text-ellipsis overflow-hidden">
                  {process.description} •{" "}
                  {new Date(process.created_at).toLocaleDateString()}
                </p>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <CompareProcess processId1={processId1} processId2={processId2} />
    </div>
  );
}
