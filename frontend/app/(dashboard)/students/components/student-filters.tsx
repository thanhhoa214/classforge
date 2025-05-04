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

export interface StudentFiltersType {
  house?: string;
  performanceRange?: {
    min: number;
    max: number;
  };
  search?: string;
}

export function StudentFilters({
  filters,
  onFiltersChange,
}: {
  filters: StudentFiltersType;
  onFiltersChange: (filters: StudentFiltersType) => void;
}) {
  const handleFilterChange = (newFilters: Partial<StudentFiltersType>) => {
    const updatedFilters = { ...filters, ...newFilters };
    onFiltersChange(updatedFilters);
  };

  const houses = [
    "Redwood",
    "Vanguard",
    "Astral",
    "Phoenix",
    "Falcon",
    "Griffin",
  ];

  return (
    <div className="flex gap-4 items-center">
      <div className="flex-1">
        <Input
          placeholder="Search students..."
          value={filters.search ?? ""}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
      </div>
      <Select
        value={filters.house}
        onValueChange={(value) => handleFilterChange({ house: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="House" />
        </SelectTrigger>
        <SelectContent>
          {houses.map((house) => (
            <SelectItem key={house} value={house}>
              {house}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Performance range" />
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
