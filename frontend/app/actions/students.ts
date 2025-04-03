"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { StudentFilters } from "@/app/(dashboard)/students/student";

const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  grade: z.string().min(1, "Grade is required"),
  performance: z.number().min(0).max(100).optional(),
});

export async function getStudents(
  filters: StudentFilters = {},
  page: number = 1,
  limit: number = 10
) {
  const where: Prisma.StudentWhereInput = {
    AND: [
      filters.search
        ? {
            OR: [
              {
                name: {
                  contains: filters.search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                email: {
                  contains: filters.search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          }
        : {},
      filters.grade ? { grade: filters.grade } : {},
      filters.performanceRange
        ? {
            performance: {
              gte: filters.performanceRange.min,
              lte: filters.performanceRange.max,
            },
          }
        : {},
    ],
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.count({ where }),
  ]);

  return {
    students,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export async function createStudent(data: z.infer<typeof studentSchema>) {
  const validatedData = studentSchema.parse(data);

  try {
    await prisma.student.create({
      data: validatedData,
    });
    revalidatePath("/students");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create student" };
  }
}

export async function updateStudent(
  id: string,
  data: Partial<z.infer<typeof studentSchema>>
) {
  const validatedData = studentSchema.partial().parse(data);

  try {
    await prisma.student.update({
      where: { id },
      data: validatedData,
    });
    revalidatePath("/students");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update student" };
  }
}

export async function deleteStudent(id: string) {
  try {
    await prisma.student.delete({
      where: { id },
    });
    revalidatePath("/students");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete student" };
  }
}
