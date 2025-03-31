import { z } from "zod";

export const studentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  grade: z.string().min(1, "Grade is required"),
  performance: z.number().min(0).max(100).optional(),
  networkMetrics: z.record(z.any()).optional(),
  classroomId: z.string().optional(),
});

export type Student = z.infer<typeof studentSchema>;

export interface StudentFilters {
  grade?: string;
  performanceRange?: {
    min: number;
    max: number;
  };
  search?: string;
}

export interface StudentTableColumn {
  id: keyof Student | "actions";
  header: string;
  cell: (student: Student) => React.ReactNode;
  enableSorting?: boolean;
  enableHiding?: boolean;
}
