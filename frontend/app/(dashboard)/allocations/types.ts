export interface AllocationResult {
  processId: number;
  metrics: {
    overallScore: number;
    academicBalance: number;
    socialBalance: number;
  };
}
