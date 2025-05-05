"use client";

import { Button } from "@/components/ui/button";
import { type AllocationResult } from "../types";
import { toast } from "sonner";

interface AlgorithmFormProps {
  onResult: (result: AllocationResult) => void;
}

const priorityOptions = ["academic", "mental", "social", "balance"];

export function AlgorithmForm({ onResult }: AlgorithmFormProps) {
  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    try {
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
    <form onSubmit={onSubmit} className="space-y-6">
      <strong className="text-muted-foreground">Priorities</strong>
      <div className="grid grid-cols-4 gap-3 mt-2">
        {priorityOptions.map((option) => (
          <div key={option} className="w-full flex flex-col">
            <input
              type="radio"
              id={option}
              name={"priority"}
              className="h-4 w-4 sr-only peer"
            />
            <label
              htmlFor={option}
              className="w-full text-center font-medium border border-primary/80 hover:bg-primary/10 rounded-md p-2 cursor-pointer peer-checked:!bg-primary/80 peer-checked:text-primary-foreground"
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
              <p className="text-xs font-light mt-2 text-center border-t pt-1">
                Lorem ipsum dolor sit amet consectetur adipisicing elit
              </p>
            </label>
          </div>
        ))}
      </div>

      <Button type="submit">Generate Allocation </Button>
    </form>
  );
}
