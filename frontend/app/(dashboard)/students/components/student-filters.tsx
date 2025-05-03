"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { StudentFilters } from "@/app/(dashboard)/students/student";

export function StudentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFilters: StudentFilters = {
    search: searchParams.get("search") ?? undefined,
    grade: searchParams.get("grade") ?? undefined,
    performanceRange: searchParams.get("performanceRange")
      ? {
          min: parseInt(searchParams.get("performanceRange")!.split("-")[0]),
          max: parseInt(searchParams.get("performanceRange")!.split("-")[1]),
        }
      : undefined,
  };

  const handleFilterChange = (newFilters: Partial<StudentFilters>) => {
    const params = new URLSearchParams(searchParams);

    if (newFilters.search) {
      params.set("search", newFilters.search);
    } else {
      params.delete("search");
    }

    if (newFilters.grade) {
      params.set("grade", newFilters.grade);
    } else {
      params.delete("grade");
    }

    if (newFilters.performanceRange) {
      params.set(
        "performanceRange",
        `${newFilters.performanceRange.min}-${newFilters.performanceRange.max}`
      );
    } else {
      params.delete("performanceRange");
    }

    router.push(`/students?${params.toString()}`);
  };

  return (
    <div className="flex gap-4 items-center">
      <div className="flex-1">
        <Input
          placeholder="Search students..."
          value={currentFilters.search ?? ""}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
      </div>
      <Select
        value={currentFilters.grade}
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
      <Select
        value={
          currentFilters.performanceRange
            ? `${currentFilters.performanceRange.min}-${currentFilters.performanceRange.max}`
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
      <Button
        variant="outline"
        onClick={() => {
          router.push("/students");
        }}
      >
        Clear Filters
      </Button>
    </div>
  );
}
