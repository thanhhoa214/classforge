"use client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ProcessedStudent,
  useStudentsApiFromProcessId,
} from "@/hooks/useStudents";
import {
  BarChart,
  Bar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AllocationResult } from "../types";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const RadarMetric = ({ student }: { student: ProcessedStudent }) => {
  const data = [
    { metric: "Academic", value: student.academicScore },
    { metric: "Social", value: student.socialScore },
    { metric: "Mental", value: student.mentalScore },
  ];
  return (
    <RadarChart outerRadius={100} width={300} height={240} data={data}>
      <PolarGrid />
      <PolarAngleAxis dataKey="metric" />
      <PolarRadiusAxis angle={30} domain={[0, 100]} />
      <Radar
        name="Scores"
        dataKey="value"
        stroke="#3b82f6"
        fill="#3b82f6"
        fillOpacity={0.6}
      />
    </RadarChart>
  );
};

export default function PreviewPanel({ result }: { result: AllocationResult }) {
  const { data: students } = useStudentsApiFromProcessId(result.processId);
  const [selectedStudentId, setSelectedStudentId] = useState<string>();

  useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].participantId + "");
    }
  }, [students, selectedStudentId]);

  const selectedStudent = students?.find(
    (s) => s.participantId + "" === selectedStudentId
  );

  return (
    <div className="flex *:w-1/2 gap-4 p-6">
      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Class Overview</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[result.metrics]}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Legend />

              <Bar
                dataKey="overallScore"
                fill="#4f46e5"
                name="Overall Score"
                barSize={30}
              />
              <Bar
                dataKey="academicBalance"
                fill="#10b981"
                name="Academic Balance"
                barSize={30}
              />
              <Bar
                dataKey="socialBalance"
                fill="#f59e0b"
                name="Social Balance"
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {students && <StudentsTableCard students={students} />}

      {selectedStudent && (
        <Card>
          <CardHeader>
            {students && students.length > 0 && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-4">Student Overview</h2>
                <Select
                  value={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem
                        key={s.participantId}
                        value={String(s.participantId)}
                      >
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <RadarMetric student={selectedStudent} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StudentsTableCard({ students }: { students: ProcessedStudent[] }) {
  const [randomSeed, setRandomSeed] = useState<number>(1);

  const random15Students = useMemo(() => {
    return (
      students &&
      Array.from({ length: 10 }, () =>
        Math.floor(Math.random() * (students.length || 1) * randomSeed)
      ).map((index) => students[index])
    );
  }, [students, randomSeed]);

  return (
    <Card>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>
              A shortlist of students.{" "}
              <Button
                variant={"link"}
                onClick={() => setRandomSeed((prev) => prev + 0.000000000001)}
              >
                Randomize
              </Button>{" "}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Academic</TableHead>
                <TableHead className="text-right">Social</TableHead>
                <TableHead className="text-right">Mental</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {random15Students?.slice(0, 10).map((student) => (
                <TableRow key={student.participantId}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatNumber(student.academicScore)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatNumber(student.socialScore)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatNumber(student.mentalScore)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
