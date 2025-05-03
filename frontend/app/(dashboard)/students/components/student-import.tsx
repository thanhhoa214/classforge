"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Student } from "@/app/(dashboard)/students/student";

interface StudentImportProps {
  onImport?: (students: Student[]) => void;
}

export function StudentImport({ onImport }: StudentImportProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const students: Student[] = (jsonData as Student[]).map((row) => ({
          name: row.name,
          email: row.email,
          grade: row.grade,
          performance: row.performance,
        }));

        onImport?.(students);
      } catch (error) {
        console.error("Error importing file:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [onImport]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  return (
    <Button
      variant="outline"
      {...getRootProps()}
      disabled={isUploading}
      className="cursor-pointer"
    >
      <input {...getInputProps()} />
      <Upload className="mr-2 h-4 w-4" />
      {isUploading
        ? "Uploading..."
        : isDragActive
        ? "Drop file here"
        : "Import Students"}
    </Button>
  );
}
