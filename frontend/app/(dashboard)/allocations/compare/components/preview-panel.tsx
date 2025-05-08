"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type AllocationResult } from "../../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PreviewPanelProps {
  result: AllocationResult | null;
}

export function PreviewPanel({ result }: PreviewPanelProps) {
  const [displayRESULT, setDisplayRESULT] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"analytics" | "info">("analytics");
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<"start" | "end">("start");

  useEffect(() => {
    if (!result) {
      setDisplayRESULT({
        classrooms: [
          {
            id: "class-1",
            name: "Class A",
            students: [
              {
                id: "student-1",
                name: "Alice",
                metrics: {
                  socialConnections: 0.9,
                  academicPerformance: 0.8,
                  behavioralMetrics: 0.85,
                  learningStyle: 0.8,
                  specialNeeds: 0.7,
                },
              },
              {
                id: "student-2",
                name: "Bob",
                metrics: {
                  socialConnections: 0.85,
                  academicPerformance: 0.75,
                  behavioralMetrics: 0.8,
                  learningStyle: 0.75,
                  specialNeeds: 0.65,
                },
              },
              {
                id: "student-3",
                name: "Charlie",
                metrics: {
                  socialConnections: 0.8,
                  academicPerformance: 0.7,
                  behavioralMetrics: 0.75,
                  learningStyle: 0.7,
                  specialNeeds: 0.6,
                },
              },
            ],
          },
          {
            id: "class-2",
            name: "Class B",
            students: [
              {
                id: "student-4",
                name: "David",
                metrics: {
                  socialConnections: 0.8,
                  academicPerformance: 0.7,
                  behavioralMetrics: 0.75,
                  learningStyle: 0.7,
                  specialNeeds: 0.6,
                },
              },
              {
                id: "student-5",
                name: "Eve",
                metrics: {
                  socialConnections: 0.75,
                  academicPerformance: 0.65,
                  behavioralMetrics: 0.7,
                  learningStyle: 0.65,
                  specialNeeds: 0.55,
                },
              },
              {
                id: "student-6",
                name: "Frank",
                metrics: {
                  socialConnections: 0.7,
                  academicPerformance: 0.6,
                  behavioralMetrics: 0.65,
                  learningStyle: 0.6,
                  specialNeeds: 0.5,
                },
              },
            ],
          },
        ],
        metrics: {
          socialBalance: 0.85,
          academicBalance: 0.78,
          constraintSatisfaction: 0.95,
          overallScore: 0.88,
        },
      });
    } else {
      setDisplayRESULT(result);
    }
  }, [result]);

  if (!displayRESULT) {
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

  const students = displayRESULT.classrooms.flatMap(
    (classroom: any) => classroom.students
  );
  const studentsToShow =
    viewMode === "start"
      ? students.slice(currentPage * 10, (currentPage + 1) * 10)
      : students.slice(-10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allocation Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="tabs flex space-x-4 mb-4">
          <button
            className={`tab px-5 py-1 rounded-lg shadow-md transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-primary text-white shadow-lg"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </button>
          <button
            className={`tab px-3 py-2 rounded-lg shadow-md transition-all cursor-pointer ${
              activeTab === "info"
                ? "bg-primary text-white shadow-lg"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab("info")}
          >
            Info
          </button>
        </div>

        {activeTab === "analytics" && (
          <div>
            <h3 className="text-sm font-medium mb-2">Classrooms</h3>
            <div className="space-y-2">
              {displayRESULT.classrooms.map((classroom: any) => (
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
            <h3 className="text-sm font-medium mb-2 mt-4">
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Academic Balance</span>
                  <span>
                    {Math.round(displayRESULT.metrics.academicBalance * 100)}%
                  </span>
                </div>
                <Progress value={displayRESULT.metrics.academicBalance * 100} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Constraint Satisfaction</span>
                  <span>
                    {Math.round(
                      displayRESULT.metrics.constraintSatisfaction * 100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={displayRESULT.metrics.constraintSatisfaction * 100}
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Score</span>
                  <span>
                    {Math.round(displayRESULT.metrics.overallScore * 100)}%
                  </span>
                </div>
                <Progress value={displayRESULT.metrics.overallScore * 100} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "info" && (
          <div>
            <h3 className="text-sm font-medium mb-2">Student Metrics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentsToShow}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="metrics.socialConnections"
                  fill="#8884d8"
                  name="Social Connections"
                />
                <Bar
                  dataKey="metrics.academicPerformance"
                  fill="#82ca9d"
                  name="Academic Performance"
                />
                <Bar
                  dataKey="metrics.behavioralMetrics"
                  fill="#ffc658"
                  name="Behavioral Metrics"
                />
                <Bar
                  dataKey="metrics.learningStyle"
                  fill="#ff7300"
                  name="Learning Style"
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-between mt-4">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={(currentPage + 1) * 10 >= students.length}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
