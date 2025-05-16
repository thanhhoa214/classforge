"use client";

import { AlgorithmForm } from "./components/algorithm-form";
import PreviewPanel, { useAllocationResult } from "./components/preview-panel";
import { ChartColumnBig, TriangleAlert } from "lucide-react";
import AiChat from "./components/ai-chat";
import { ApiQueryClient } from "@/lib/api";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import ClassNetwork from "../students/components/class-network";
import ClassIdSelect from "@/components/ui2/ClassIdSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AllocationsPage() {
  const [jobId, setJobId] = useLocalStorage<number | undefined>(
    "jobId",
    undefined,
    { initializeWithValue: false }
  );
  const { data: jobStatus, isLoading: isJobStatusLoading } =
    ApiQueryClient.useQuery(
      "get",
      "/job-status/{job_id}",
      { params: { path: { job_id: jobId + "" } } },
      {
        enabled: !!jobId,
        refetchInterval: (data) => {
          if (data?.state.data?.status !== "processing") return false;
          return 5_000;
        },
      }
    );

  const [processId, setProcessId] = useState<number>();
  const [classId, setClassId] = useState<number>();
  const [chatId, setChatId] = useState<number>();

  useEffect(() => {
    if (jobStatus?.status === "completed") {
      setProcessId(jobStatus.result);
      setChatId(Math.round(Math.random() * 1_000_000));
    }
  }, [jobStatus]);

  const { data: result, isLoading: isMetricLoading } =
    useAllocationResult(processId);

  const isLoading =
    isJobStatusLoading || isMetricLoading || jobStatus?.status === "processing";
  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Classroom Allocation Generator</h1>
        <p className="text-muted-foreground">
          Generate optimal classroom allocations using our advanced algorithms.
        </p>
      </div>

      <div className="w-4/5 max-w-5xl mx-auto mb-12">
        <AlgorithmForm
          onResult={(r) => setJobId(r.job_id)}
          isLoading={isLoading}
        />
        {jobStatus?.status === "failed" && (
          <p className="text-red-500 text-center mt-2 flex justify-center items-center gap-2">
            <TriangleAlert size={20} /> Failed to generate allocation. Please
            try again.
          </p>
        )}
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
              <div className="w-3/4 flex flex-col gap-4">
                <PreviewPanel result={result} />

                <Card>
                  <CardHeader>
                    <CardTitle>Class Network</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ClassIdSelect
                      processId={result.processId}
                      classId={classId}
                      onClassIdChange={setClassId}
                    />
                    <ClassNetwork classId={classId} className="w-full mt-2" />
                  </CardContent>
                </Card>
              </div>
              {chatId && (
                <AiChat
                  chatId={chatId}
                  processId={result.processId}
                  onProcessIdChange={setProcessId}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
