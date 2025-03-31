import { useState, useEffect } from "react";
import { Student, StudentFilters } from "../types/student";

interface UseStudentsReturn {
  students: Student[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  fetchStudents: (filters: StudentFilters, page: number) => Promise<void>;
  createStudent: (student: Omit<Student, "id">) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
}

export function useStudents(): UseStudentsReturn {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStudents = async (
    filters: StudentFilters,
    currentPage: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(filters.grade && { grade: filters.grade }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/students?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(data.students);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const createStudent = async (student: Omit<Student, "id">) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(student),
      });

      if (!response.ok) {
        throw new Error("Failed to create student");
      }

      await fetchStudents({}, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStudent = async (id: string, student: Partial<Student>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/students", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...student }),
      });

      if (!response.ok) {
        throw new Error("Failed to update student");
      }

      await fetchStudents({}, page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/students?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete student");
      }

      await fetchStudents({}, page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents({}, 1);
  }, []);

  return {
    students,
    loading,
    error,
    total,
    page,
    totalPages,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
  };
}
