"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { deleteStudent } from "../../../actions/students";
import { useToast } from "@/components/ui/use-toast";
import { Student } from "@prisma/client";

interface StudentActionsProps {
  student: Student;
}

export function StudentActions({ student }: StudentActionsProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        const result = await deleteStudent(student.id);
        if (result.success) {
          toast({
            title: "Success",
            description: "Student deleted successfully",
          });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to delete student",
        });
      }
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="ghost" size="icon">
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handleDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
