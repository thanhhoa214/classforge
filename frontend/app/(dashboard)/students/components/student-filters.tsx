"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ClassIdSelect from "@/components/ui2/ClassIdSelect";

export interface StudentFiltersType {
  classId?: string;
  performanceRange?: {
    min: number;
    max: number;
  };
  search?: string;
}

export function StudentFilters({
  processId,
  filters,
  onFiltersChange,
}: {
  processId?: number;
  filters: StudentFiltersType;
  onFiltersChange: (filters: StudentFiltersType) => void;
}) {
  const handleFilterChange = (newFilters: Partial<StudentFiltersType>) => {
    const updatedFilters = { ...filters, ...newFilters };
    onFiltersChange(updatedFilters);
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1">
        <Input
          className="h-10"
          placeholder="Search students..."
          value={filters.search ?? ""}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
      </div>
      <ClassIdSelect
        processId={processId!}
        classId={filters.classId ? parseInt(filters.classId) : undefined}
        onClassIdChange={(classId) =>
          handleFilterChange({ classId: classId.toString() })
        }
      />
      <Select
        value={
          filters.performanceRange
            ? `${filters.performanceRange.min}-${filters.performanceRange.max}`
            : undefined
        }
        onValueChange={(value) => {
          const [min, max] = value.split("-").map(Number);
          handleFilterChange({
            performanceRange: { min, max },
          });
        }}
      >
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Score" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0-50">0-50%</SelectItem>
          <SelectItem value="50-70">50-70%</SelectItem>
          <SelectItem value="70-85">70-85%</SelectItem>
          <SelectItem value="85-100">85-100%</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={() => onFiltersChange({})}>
        Clear Filters
      </Button>
    </div>
  );
}
