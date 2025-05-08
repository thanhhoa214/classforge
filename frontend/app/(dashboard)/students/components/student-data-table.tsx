"use client";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useMemo } from "react";
import { StudentFilters, StudentFiltersType } from "./student-filters";
import { Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useStudentsApiFromProcessId } from "@/hooks/useStudents";

export function StudentDataTable({
  processId,
  onSelectedIdChange,
}: {
  processId?: number;
  className?: string;
  onSelectedIdChange?: (id: number) => void;
}) {
  const [filters, setFilters] = useState<StudentFiltersType>({});
  const { isLoading, data } = useStudentsApiFromProcessId(processId);

  // Pagination state and constants
  const STUDENTS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter students
  const students = useMemo(() => {
    return (
      data?.filter((student) => {
        if (
          filters.house &&
          student.house.toLowerCase() !== filters.house.toLowerCase()
        ) {
          return false;
        }

        if (filters.performanceRange) {
          const performance = Number(student.academicScore) ?? 0;
          const { min, max } = filters.performanceRange;
          if (!performance) return false;
          if (performance < min || performance > max) return false;
        }
        if (filters.search && ![student.name].join().includes(filters.search)) {
          return false;
        }
        return true;
      }) ?? []
    );
  }, [data, filters]);

  // Calculate pagination
  const totalPages = Math.max(
    1,
    Math.ceil(students.length / STUDENTS_PER_PAGE)
  );
  const paginatedStudents = useMemo(() => {
    const startIdx = (currentPage - 1) * STUDENTS_PER_PAGE;
    return students.slice(startIdx, startIdx + STUDENTS_PER_PAGE);
  }, [students, currentPage]);

  // Reset to first page if filters change or students data changes
  useMemo(() => {
    setCurrentPage(1);
  }, [filters, data]);

  // Update selected ID and notify parent component
  const handleStudentClick = (id: number) => {
    onSelectedIdChange?.(id);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Generate page numbers (show up to 5 pages, with ellipsis if needed)
  const getPageNumbers = (): number[] => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, -1, totalPages];
    if (currentPage >= totalPages - 2)
      return [
        1,
        -1,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [
      1,
      -1,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      -1,
      totalPages,
    ];
  };

  return (
    <div className="space-y-4 grow">
      <StudentFilters filters={filters} onFiltersChange={setFilters} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participant ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>House</TableHead>
            <TableHead className="text-right">Academic Score</TableHead>
            <TableHead className="text-right">Mental Score</TableHead>
            <TableHead className="text-right">Social Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                <span className="inline-flex flex-col items-center justify-center gap-1">
                  <Loader2 className="animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading students...
                  </span>
                </span>
              </TableCell>
            </TableRow>
          ) : paginatedStudents.length ? (
            paginatedStudents.map((student) => (
              <TableRow
                key={student.participantId}
                className="cursor-pointer"
                onClick={() => handleStudentClick(student.participantId)}
              >
                <TableCell>{student.participantId}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.house}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(student.academicScore)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(student.mentalScore)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(student.socialScore)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No students found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={currentPage === 1}
              tabIndex={currentPage === 1 ? -1 : 0}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage - 1);
              }}
            />
          </PaginationItem>
          {getPageNumbers().map((page, idx) =>
            page === -1 ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={page === currentPage}
                  aria-current={page === currentPage ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page);
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={currentPage === totalPages}
              tabIndex={currentPage === totalPages ? -1 : 0}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
