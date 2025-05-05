"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  AllocationConfigSchema,
  type AllocationResult,
} from "../(dashboard)/allocations/types";
import { prisma } from "@/lib/prisma";
import { Preset } from "@prisma/client";
import { ComparisonResult } from "../(dashboard)/allocations/compare/components/preset-comparison";
import { neo4jDriver } from "@/lib/neo4j";

export async function getProcesses() {
  const query = "MATCH (n:ProcessRun) RETURN n ORDER BY n.id DESC";
  return neo4jDriver.executeQuery(query);
}

export async function generateAllocation(
  config: Preset["config"]
): Promise<AllocationResult> {
  try {
    // Validate the config
    const validatedConfig = AllocationConfigSchema.parse(config);
    console.log(validatedConfig);

    // TODO: Implement actual allocation generation logic
    // This is a mock implementation
    const result: AllocationResult = {
      classrooms: [
        {
          id: "class-1",
          name: "Class A",
          students: [
            {
              id: "student-1",
              name: "Alice",
              metrics: {
                socialConnections: 0.9,
                academicPerformance: 0.8,
                behavioralMetrics: 0.85,
                learningStyle: 0.8,
                specialNeeds: 0.7,
              },
            },
            {
              id: "student-2",
              name: "Bob",
              metrics: {
                socialConnections: 0.85,
                academicPerformance: 0.75,
                behavioralMetrics: 0.8,
                learningStyle: 0.75,
                specialNeeds: 0.65,
              },
            },
            {
              id: "student-3",
              name: "Charlie",
              metrics: {
                socialConnections: 0.8,
                academicPerformance: 0.7,
                behavioralMetrics: 0.75,
                learningStyle: 0.7,
                specialNeeds: 0.6,
              },
            },
          ],
        },
        {
          id: "class-2",
          name: "Class B",
          students: [
            {
              id: "student-4",
              name: "David",
              metrics: {
                socialConnections: 0.8,
                academicPerformance: 0.7,
                behavioralMetrics: 0.75,
                learningStyle: 0.7,
                specialNeeds: 0.6,
              },
            },
            {
              id: "student-5",
              name: "Eve",
              metrics: {
                socialConnections: 0.75,
                academicPerformance: 0.65,
                behavioralMetrics: 0.7,
                learningStyle: 0.65,
                specialNeeds: 0.55,
              },
            },
            {
              id: "student-6",
              name: "Frank",
              metrics: {
                socialConnections: 0.7,
                academicPerformance: 0.6,
                behavioralMetrics: 0.65,
                learningStyle: 0.6,
                specialNeeds: 0.5,
              },
            },
          ],
        },
      ],
      metrics: {
        socialBalance: 0.85,
        academicBalance: 0.78,
        constraintSatisfaction: 0.95,
        overallScore: 0.88,
      },
    };

    // Revalidate the allocations page
    revalidatePath("/allocations");

    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Invalid configuration: " + error.message);
    }
    throw new Error("Failed to generate allocation");
  }
}

export async function saveAllocationConfig(
  config: z.infer<typeof AllocationConfigSchema>
): Promise<void> {
  try {
    const validatedConfig = AllocationConfigSchema.parse(config);
    console.log(validatedConfig);

    // TODO: Implement actual config saving logic
    // This would typically involve saving to a database

    revalidatePath("/allocations");
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Invalid configuration: " + error.message);
    }
    throw new Error("Failed to save configuration");
  }
}

export async function savePreset(
  name: string,
  config: z.infer<typeof AllocationConfigSchema>
): Promise<void> {
  try {
    const validatedConfig = AllocationConfigSchema.parse(config);
    console.log(validatedConfig);

    // TODO: Implement actual preset saving logic
    // This would typically involve saving to a database with user association

    revalidatePath("/allocations");
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Invalid configuration: " + error.message);
    }
    throw new Error("Failed to save preset");
  }
}

export async function getPresets() {
  return prisma.preset.findMany();
}

export async function deletePreset(id: string): Promise<void> {
  try {
    await prisma.preset.delete({ where: { id } });
    revalidatePath("/allocations");
  } catch {
    throw new Error("Failed to delete preset");
  }
}

export async function comparePresets(
  preset1Id: string,
  preset2Id: string
): Promise<ComparisonResult> {
  try {
    const [preset1, preset2] = await Promise.all([
      prisma.preset.findUnique({ where: { id: preset1Id } }),
      prisma.preset.findUnique({ where: { id: preset2Id } }),
    ]);

    if (!preset1 || !preset2) {
      throw new Error("One or both presets not found");
    }

    const allocation1 = await generateAllocation(preset1.config);
    const allocation2 = await generateAllocation(preset2.config);

    return {
      preset1: {
        name: preset1.name,
        config: preset1.config,
        allocation: allocation1,
      },
      preset2: {
        name: preset2.name,
        config: preset2.config,
        allocation: allocation2,
      },
    };
  } catch {
    throw new Error("Failed to compare presets");
  }
}
