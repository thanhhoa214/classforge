"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type AllocationResult } from "../types";

interface PreviewPanelProps {
  result: AllocationResult | null;
}

export function PreviewPanel({ result }: PreviewPanelProps) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Generate an allocation to see the preview.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allocation Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Classrooms</h3>
          <div className="space-y-2">
            {result.classrooms.map((classroom) => (
              <div
                key={classroom.id}
                className="p-3 border rounded-lg bg-muted/50"
              >
                <h4 className="font-medium">{classroom.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {classroom.students.length} students
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Isolation Score</span>
                <span>{Math.round(result.metrics.isolationScore * 100)}%</span>
              </div>
              <Progress value={result.metrics.isolationScore * 100} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Connection Density</span>
                <span>
                  {Math.round(result.metrics.connectionDensity * 100)}%
                </span>
              </div>
              <Progress value={result.metrics.connectionDensity * 100} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Balance Score</span>
                <span>{Math.round(result.metrics.balanceScore * 100)}%</span>
              </div>
              <Progress value={result.metrics.balanceScore * 100} />
            </div>
            <div className="text-sm text-muted-foreground">
              Computation Time: {result.metrics.computationTime.toFixed(2)}s
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
