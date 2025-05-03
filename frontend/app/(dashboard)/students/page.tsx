import { Suspense } from "react";
import { StudentDataTable } from "./components/student-data-table";
import { StudentFilters } from "./components/student-filters";
import { StudentImport } from "./components/student-import";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { StudentFilters as StudentFiltersType } from "@/app/(dashboard)/students/student";

interface StudentsPageProps {
  searchParams: Promise<{
    search?: string;
    grade?: string;
    performanceRange?: string;
    page?: string;
  }>;
}

export default async function StudentsPage(props: StudentsPageProps) {
  const searchParams = await props.searchParams;
  const filters: StudentFiltersType = {
    search: searchParams.search,
    grade: searchParams.grade,
    performanceRange: searchParams.performanceRange
      ? {
          min: parseInt(searchParams.performanceRange.split("-")[0]),
          max: parseInt(searchParams.performanceRange.split("-")[1]),
        }
      : undefined,
  };

  const page = searchParams.page ? parseInt(searchParams.page) : 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Student Management</h1>
        <div className="flex gap-4">
          <StudentImport />
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>
      <div className="mb-4">
        <StudentFilters />
      </div>
      <Suspense fallback={<div>Loading students...</div>}>
        <StudentDataTable filters={filters} page={page} />
      </Suspense>
    </div>
  );
}
