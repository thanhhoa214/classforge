import { Suspense } from "react";
import { StudentDataTable } from "./components/student-data-table";
import { StudentFilters } from "./components/student-filters";
import { StudentImport } from "./components/student-import";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function StudentsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Student Management</h1>
        <div className="flex gap-4">
          <StudentImport />
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <StudentFilters />
      </div>

      <Suspense fallback={<div>Loading students...</div>}>
        <StudentDataTable />
      </Suspense>
    </div>
  );
}
