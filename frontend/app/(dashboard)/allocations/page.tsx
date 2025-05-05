"use client";

import { useState } from "react";
import { type AllocationResult } from "./types";
import { AlgorithmForm } from "./components/algorithm-form";
import { PreviewPanel } from "./components/preview-panel";

export default function AllocationsPage() {
  const [result, setResult] = useState<AllocationResult | null>(null);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Classroom Allocation Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate optimal classroom allocations using our advanced algorithms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <AlgorithmForm onResult={setResult} />
        </div>
        <div>
          <PreviewPanel result={result} />
        </div>
      </div>
    </div>
  );
}
