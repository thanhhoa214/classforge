import { z } from "zod";

export const AlgorithmType = {
  GNN: "gnn",
  RL: "rl",
} as const;

export type AlgorithmType = (typeof AlgorithmType)[keyof typeof AlgorithmType];

export const PriorityType = {
  ACADEMIC: "academic",
  FRIENDSHIP: "friendship",
  ADVICE: "advice",
  INFLUENCE: "influence",
  DISRESPECT: "disrespect",
} as const;

export type PriorityType = (typeof PriorityType)[keyof typeof PriorityType];

export const PrioritySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(PriorityType),
  weight: z.number().min(0).max(1),
  order: z.number(),
});

export const PresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  config: z.object({
    algorithm: z.nativeEnum(AlgorithmType),
    parameters: z.record(z.number()),
    priorities: z.array(PrioritySchema),
    constraints: z.array(
      z.object({
        type: z.enum(["required", "forbidden"]),
        studentIds: z.array(z.string()),
      })
    ),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AllocationConfigSchema = z.object({
  algorithm: z.nativeEnum(AlgorithmType),
  parameters: z.record(z.number()),
  priorities: z.array(PrioritySchema),
  constraints: z.array(
    z.object({
      type: z.enum(["required", "forbidden"]),
      studentIds: z.array(z.string()),
    })
  ),
});

export type AllocationConfig = z.infer<typeof AllocationConfigSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type Preset = z.infer<typeof PresetSchema>;
export type Constraint = z.infer<
  typeof AllocationConfigSchema
>["constraints"][number];

export interface AllocationResult {
  id: string;
  config: AllocationConfig;
  classrooms: Array<{
    id: string;
    name: string;
    students: string[];
  }>;
  metrics: {
    isolationScore: number;
    connectionDensity: number;
    balanceScore: number;
    computationTime: number;
  };
  createdAt: Date;
}
