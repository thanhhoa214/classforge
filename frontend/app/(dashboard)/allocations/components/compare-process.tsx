"use client";
import PreviewPanel, { useAllocationResult } from "./preview-panel";

export default function CompareProcess({
  processId1,
  processId2,
}: {
  processId1: number;
  processId2: number;
}) {
  const { data: result1 } = useAllocationResult(processId1);
  const { data: result2 } = useAllocationResult(processId2);

  return (
    <>
      {result1 && <PreviewPanel result={result1} />}
      {result2 && <PreviewPanel result={result2} />}
    </>
  );
}
