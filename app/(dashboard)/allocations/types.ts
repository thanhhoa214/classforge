import { z } from "zod";

export enum AlgorithmType {
  GNN = "GNN",
  KMEANS = "KMEANS",
  RANDOM = "RANDOM",
}

export enum PriorityType {
  ACADEMIC_PERFORMANCE = "ACADEMIC_PERFORMANCE",
  SOCIAL_CONNECTIONS = "SOCIAL_CONNECTIONS",
  BEHAVIORAL_METRICS = "BEHAVIORAL_METRICS",
  LEARNING_STYLE = "LEARNING_STYLE",
  SPECIAL_NEEDS = "SPECIAL_NEEDS",
}

export interface Priority {
  id: string;
  name: string;
  type: PriorityType;
  weight: number;
  order: number;
}

export interface AllocationConfig {
  algorithm: AlgorithmType;
  parameters: {
    learningRate?: number;
    epochs?: number;
    batchSize?: number;
    nClusters?: number;
  };
  priorities: Priority[];
  constraints: Array<{
    type: "REQUIRED" | "FORBIDDEN";
    student1Id: string;
    student2Id: string;
  }>;
}

export interface AllocationResult {
  classrooms: Array<{
    id: string;
    name: string;
    students: Array<{
      id: string;
      name: string;
      metrics: {
        academicPerformance: number;
        socialConnections: number;
        behavioralMetrics: number;
        learningStyle: number;
        specialNeeds: number;
      };
    }>;
  }>;
  metrics: {
    overallScore: number;
    academicBalance: number;
    socialBalance: number;
    constraintSatisfaction: number;
  };
}

export const PrioritySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(PriorityType),
  weight: z.number().min(0).max(1),
  order: z.number().int().min(0),
});

export const AllocationConfigSchema = z.object({
  algorithm: z.nativeEnum(AlgorithmType),
  parameters: z.object({
    learningRate: z.number().optional(),
    epochs: z.number().optional(),
    batchSize: z.number().optional(),
    nClusters: z.number().optional(),
  }),
  priorities: z.array(PrioritySchema),
  constraints: z.array(
    z.object({
      type: z.enum(["REQUIRED", "FORBIDDEN"]),
      student1Id: z.string(),
      student2Id: z.string(),
    })
  ),
});

export type AllocationConfigType = z.infer<typeof AllocationConfigSchema>;
export type PrioritySchemaType = z.infer<typeof PrioritySchema>;
export type ConstraintType = z.infer<
  typeof AllocationConfigSchema
>["constraints"][number];
