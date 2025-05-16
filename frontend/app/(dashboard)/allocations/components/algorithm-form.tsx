"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { ApiQueryClient } from "@/lib/api";
import { components, paths } from "@/lib/api/swagger";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface AlgorithmFormProps {
  isLoading: boolean;
  onResult: (
    result: paths["/run"]["post"]["responses"]["200"]["content"]["application/json"]
  ) => void;
}
const priorityOptions: {
  value: components["schemas"]["OptionEnum"];
  label: string;
  description: string;
}[] = [
  {
    value: "balanced",
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

export function AlgorithmForm({ onResult, isLoading }: AlgorithmFormProps) {
  const [option, setOption] = useState(priorityOptions[0].value);
  const { mutate: reallocate, isPending } = ApiQueryClient.useMutation(
    "post",
    "/run",
    { onSuccess: onResult }
  );

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const priority = (e.target as HTMLFormElement).priority
      .value as components["schemas"]["OptionEnum"];

    try {
      reallocate({ body: { option: priority, save_data: true } });
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
    <form onSubmit={onSubmit} className="text-center">
      <p className="text-muted-foreground mb-2">
        What criteria do you prioritize?
      </p>
      <div className="flex gap-3 mb-8">
        {priorityOptions.map((o) => (
          <div key={o.value} className="w-1/4 flex flex-col">
            <input
              type="radio"
              id={o.value}
              name={"priority"}
              className="h-4 w-4 sr-only peer"
              value={o.value}
              checked={o.value === option}
              onChange={(e) =>
                setOption(e.target.value as components["schemas"]["OptionEnum"])
              }
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

      <div className="flex flex-col items-center justify-center">
        <Button
          type="submit"
          size={"lg"}
          className="text-base mb-2"
          disabled={isPending || isLoading}
        >
          {isPending || isLoading ? (
            <>
              <Loader2 className="animate-spin" /> Generating...
            </>
          ) : (
            "Generate Allocation"
          )}
        </Button>

        {isPending ||
          (isLoading && (
            <p className="text-muted-foreground text-sm mb-4">
              It may take minutes to generate the allocation.
            </p>
          ))}

        <Button
          variant={"link"}
          size={"lg"}
          className="text-base underline"
          type="button"
          asChild
        >
          <Link href={"/allocations/compare"}>
            Review & compare previous allocations <ArrowRight />
          </Link>
        </Button>
      </div>
    </form>
  );
}
