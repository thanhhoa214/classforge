"use client";

import { Button } from "@/components/ui/button";
import { type AllocationResult } from "../types";
import { toast } from "sonner";
import { useState } from "react";
import { ApiQueryClient } from "@/lib/api";

interface AlgorithmFormProps {
  onResult: (result: AllocationResult) => void;
}
const priorityOptions = [
  {
    value: "balance",
    label: "Balanced Approach",
    description: "Equitable resource distribution for diverse needs",
  },
  {
    value: "academic",
    label: "Academic Focus",
    description: "Optimize environments for academic performance",
  },
  {
    value: "mental",
    label: "Mental Wellbeing",
    description: "Supportive settings for positive mental health",
  },
  {
    value: "social",
    label: "Social Interaction",
    description: "Foster collaboration and community",
  },
];

export function AlgorithmForm({ onResult }: AlgorithmFormProps) {
  const [option, setOption] = useState(priorityOptions[0].value);
  const { mutate: reallocate, isPending } = ApiQueryClient.useMutation(
    "get",
    "/run",
    {
      onSuccess: (data) => {
        onResult(data);
      },
    }
  );
  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      onResult({
        processId: 2,
        metrics: {
          overallScore: 0.75,
          academicBalance: 0.82,
          socialBalance: 0.77,
        },
      });
      toast.success("Allocation Generated", {
        description:
          "The classroom allocation has been generated successfully.",
      });
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate allocation",
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-center">
      <p className="text-muted-foreground">What criteria do you prioritize?</p>
      <div className="flex gap-3 mt-2">
        {priorityOptions.map((o) => (
          <div key={o.value} className="w-1/4 flex flex-col">
            <input
              type="radio"
              id={o.value}
              name={"priority"}
              className="h-4 w-4 sr-only peer"
              value={o.value}
              checked={o.value === option}
              onChange={(e) => setOption(e.target.value)}
            />
            <label
              htmlFor={o.value}
              className="flex flex-col h-full text-center font-medium border border-primary/80 hover:bg-primary/10 rounded-md p-2 cursor-pointer peer-checked:!bg-primary/80 peer-checked:text-primary-foreground"
            >
              <strong className="font-semibold">
                {o.label.charAt(0).toUpperCase() + o.label.slice(1)}
              </strong>
              <p className="text-sm font-light mt-2 text-center border-t pt-1 px-3">
                {o.description}
              </p>
            </label>
          </div>
        ))}
      </div>

      <Button type="submit" size={"lg"} className="text-base">
        Generate Allocation
      </Button>
    </form>
  );
}
