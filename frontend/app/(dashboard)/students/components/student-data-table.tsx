import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentFilters } from "@/app/(dashboard)/students/student";
import { getStudents } from "../../../actions/students";
import { StudentActions } from "./student-actions";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface StudentDataTableProps {
  filters?: StudentFilters;
  page?: number;
}

export async function StudentDataTable({
  filters = {},
  page = 1,
}: StudentDataTableProps) {
  const { students, totalPages, currentPage } = await getStudents(
    filters,
    page
  );
  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5; // Adjust as needed

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink href={`?page=${i}`} isActive={i === currentPage}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      if (currentPage > 2) {
        pages.push(
          <PaginationItem key={1}>
            <PaginationLink href="?page=1">1</PaginationLink>
          </PaginationItem>
        );
      }
      if (currentPage > 3) {
        pages.push(
          <PaginationItem key="ellipsis-prev">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink href={`?page=${i}`} isActive={i === currentPage}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        pages.push(
          <PaginationItem key="ellipsis-next">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      if (currentPage < totalPages - 1) {
        pages.push(
          <PaginationItem key={totalPages}>
            <PaginationLink href={`?page=${totalPages}`}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return pages;
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.grade}</TableCell>
                <TableCell>
                  {student.performance?.toFixed(1) ?? "N/A"}
                </TableCell>
                <TableCell>
                  <StudentActions student={student} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={currentPage > 1 ? `?page=${currentPage - 1}` : "#"}
                aria-disabled={currentPage === 1}
                className={
                  currentPage === 1
                    ? "text-muted-foreground pointer-events-none"
                    : ""
                }
              />
            </PaginationItem>

            {renderPageNumbers()}

            <PaginationItem>
              <PaginationNext
                href={
                  currentPage < totalPages ? `?page=${currentPage + 1}` : "#"
                }
                aria-disabled={currentPage === totalPages}
                className={
                  currentPage === totalPages
                    ? "text-muted-foreground pointer-events-none"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
