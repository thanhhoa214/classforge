"use client";

import { useState } from "react";
import { type AllocationResult } from "./types";
import { AlgorithmForm } from "./components/algorithm-form";
import PreviewPanel from "./components/preview-panel";
import { Bot, ChartColumnBig, LucideMessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AllocationsPage() {
  const [result, setResult] = useState<AllocationResult | null>(null);
  const [showTips, setShowTips] = useState(false);

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Classroom Allocation Generator</h1>
        <p className="text-muted-foreground">
          Generate optimal classroom allocations using our advanced algorithms.
        </p>
      </div>

      <div className="w-4/5 max-w-5xl mx-auto mb-12">
        <AlgorithmForm onResult={setResult} />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-1 text-center">
          Allocation Result
        </h2>
        {result ? (
          <>
            <p className="text-muted-foreground text-center text-sm">
              Here is the allocation result based on your selected criteria. You
              can freely update it or ask our AI to explain reasons behind the
              allocation.
            </p>
            <form className="flex items-center gap-2 max-w-xl mx-auto mt-4">
              <Bot size={32} />
              <Input placeholder="Ask me anything about the allocation..." />
              <Button>Send</Button>
            </form>

            <p className="text-sm text-muted-foreground text-center">
              <Button variant={"link"} onClick={() => setShowTips(!showTips)}>
                Want to see some tips? <LucideMessageCircleQuestion />
              </Button>
            </p>
            <ul
              className={cn(
                "list-decimal list-inside text-sm text-muted-foreground max-w-xl mx-auto",
                showTips ? "block" : "hidden"
              )}
            >
              <li>Ask normal question to regard to the results</li>
              <li>Ask to re-allocate student (keyword: swap, reallocate)</li>
              <li>
                Ask to give suggestion to to specific student (&apos;give
                suggestion to student 32394&apos;)
              </li>
            </ul>
            <PreviewPanel result={result} />
          </>
        ) : (
          <p className="text-muted-foreground text-center mt-4 p-16 border-2 border-dashed rounded-lg">
            <ChartColumnBig size={40} className="mx-auto mb-2" />
            The allocation result will be displayed here after you generate it.
          </p>
        )}
      </div>
    </div>
  );
}
