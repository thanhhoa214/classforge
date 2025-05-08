"use client";

import { useState } from "react";
import { type AllocationResult } from "./types";
import { AlgorithmForm } from "./components/algorithm-form";
import PreviewPanel from "./components/preview-panel";
import { ChartColumnBig } from "lucide-react";
import AiChat from "./components/ai-chat";

export default function AllocationsPage() {
  const [result, setResult] = useState<AllocationResult | null>(null);

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
          <p className="text-muted-foreground text-center text-sm">
            Here is the allocation result based on your selected criteria. You
            can freely update it or ask our AI to explain reasons behind the
            allocation.
          </p>
        ) : (
          <p className="text-muted-foreground text-center mt-4 p-16 border-2 border-dashed rounded-lg">
            <ChartColumnBig size={40} className="mx-auto mb-2" />
            The allocation result will be displayed here after you generate it.
          </p>
        )}
        <div className="flex items-start gap-4 mt-4">
          {result && (
            <>
              <div className="w-3/4">
                <PreviewPanel result={result} />
              </div>
              <AiChat />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
