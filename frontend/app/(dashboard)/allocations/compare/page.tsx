"use client";

import { useEffect, useState } from "react";

import { AlgorithmForm } from "./components/algorithm-form";
import PreviewPanel, { AllocationResult } from "./components/preview-panel";
import { ChartColumnBig, TriangleAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMetric } from "@/app/actions/network";
import { ApiQueryClient } from "@/lib/api";

export default function ComparePage() {
  // Track two allocations for comparison
  const [jobId, setJobId] = useState<number | undefined>();
  const [prevResult, setPrevResult] = useState<AllocationResult | undefined>();
  const [processId, setProcessId] = useState<number>();

  // Job status query
  const { data: jobStatus, isLoading: isJobStatusLoading } = ApiQueryClient.useQuery(
    "get",
    "/job-status/{job_id}",
    { params: { path: { job_id: jobId + "" } } },
    {
      enabled: !!jobId,
      refetchInterval: (data) => {
        if (data?.state.data?.status === "failed") return false;
        return 5_000;
      },
    }
  );

  useEffect(() => {
    if (jobStatus?.status === "completed") setProcessId(jobStatus.result);
  }, [jobStatus]);

  // Metric query
  const { data: metric, isLoading: isMetricLoading } = useQuery({
    queryKey: ["metric", processId],
    queryFn: () => getMetric(processId!),
    enabled: !!processId,
  });

  // Compose result
  const result: AllocationResult | undefined =
    processId && metric
      ? {
          processId,
          metrics: {
            academic_score: metric.academic_score,
            social_score: metric.social_score,
            mental_score: metric.mental_score,
          },
        }
      : undefined;

  // When a new allocation is generated, move the previous result to prevResult
  const handleResult = (r: { job_id: number }) => {
    if (result) setPrevResult(result);
    setJobId(r.job_id);
  };

  const isLoading = isJobStatusLoading || isMetricLoading || jobStatus?.status === "processing";

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Compare Allocations</h1>
        <p className="text-muted-foreground">
          Generate and compare two classroom allocations side by side.
        </p>
      </div>
      <div className="w-4/5 max-w-5xl mx-auto mb-12">
        <AlgorithmForm onResult={handleResult} isLoading={isLoading} />
        {jobStatus?.status === "failed" && (
          <p className="text-red-500 text-center mt-2 flex justify-center items-center gap-2">
            <TriangleAlert size={20} /> Failed to generate allocation. Please try again.
          </p>
        )}
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-1 text-center">Allocation Comparison</h2>
        {(result || prevResult) ? (
          <p className="text-muted-foreground text-center text-sm">
            {prevResult && result
              ? "Here are your previous and current allocations side by side."
              : "Here is the allocation result. Generate another to compare!"}
          </p>
        ) : (
          <p className="text-muted-foreground text-center mt-4 p-16 border-2 border-dashed rounded-lg">
            <ChartColumnBig size={40} className="mx-auto mb-2" />
            The allocation result will be displayed here after you generate it.
          </p>
        )}
        <div className="flex items-start gap-4 mt-4">
          {prevResult && <div className="w-1/2"><PreviewPanel result={prevResult} /></div>}
          {isLoading && (
            <div className="w-1/2 flex items-center justify-center min-h-[300px] border-2 border-dashed rounded-lg text-center text-muted-foreground p-8">
              Your Newly Generated Allocation Should be visible here soon...
            </div>
          )}
          {!isLoading && result && <div className="w-1/2"><PreviewPanel result={result} /></div>}
        </div>
      </div>
    </div>
  );
}
