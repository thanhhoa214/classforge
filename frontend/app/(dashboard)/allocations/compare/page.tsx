import { Suspense } from "react";
import AllocationComparePage from "./AllocationComparePage";

export default function ComparePage() {
  return (
    <div className="pr-2">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Compare Allocations</h1>
        <p className="text-muted-foreground">
          Generate and compare two classroom allocations side by side.
        </p>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <AllocationComparePage />
      </Suspense>
    </div>
  );
}
