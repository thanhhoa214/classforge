"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StudentFilters as StudentFiltersType } from "@/app/types/student";

interface StudentFiltersProps {
  onFilterChange?: (filters: StudentFiltersType) => void;
}

export function StudentFilters({ onFilterChange }: StudentFiltersProps) {
  const [filters, setFilters] = useState<StudentFiltersType>({
    search: "",
    grade: undefined,
    performanceRange: undefined,
  });

  const handleFilterChange = (newFilters: Partial<StudentFiltersType>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  return (
    <div className="flex gap-4 items-center">
      <div className="flex-1">
        <Input
          placeholder="Search students..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
      </div>
      <Select
        value={filters.grade}
        onValueChange={(value) => handleFilterChange({ grade: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select grade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="A">Grade A</SelectItem>
          <SelectItem value="B">Grade B</SelectItem>
          <SelectItem value="C">Grade C</SelectItem>
          <SelectItem value="D">Grade D</SelectItem>
          <SelectItem value="F">Grade F</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        onClick={() => {
          const clearedFilters = {
            search: "",
            grade: undefined,
            performanceRange: undefined,
          };
          setFilters(clearedFilters);
          onFilterChange?.(clearedFilters);
        }}
      >
        Clear Filters
      </Button>
    </div>
  );
}
