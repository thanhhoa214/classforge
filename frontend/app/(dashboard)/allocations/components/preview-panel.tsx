// pages/index.tsx
import { Card, CardContent } from "@/components/ui/card";
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
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AllocationResult } from "../types";

const RadarMetric = ({ student }: { student: ProcessedStudent }) => {
  const data = [
    { metric: "Academic", value: student.academicScore },
    { metric: "Social", value: student.socialScore },
    { metric: "Mental", value: student.mentalScore },
  ];
  return (
    <RadarChart outerRadius={90} width={300} height={250} data={data}>
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

  return (
    <main className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Class Overview</h2>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[result.metrics]}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="overallScore" fill="#4f46e5" name="Overall Score" />
              <Bar
                dataKey="academicBalance"
                fill="#10b981"
                name="Academic Balance"
              />
              <Bar
                dataKey="socialBalance"
                fill="#f59e0b"
                name="Social Balance"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {students?.map((s, i) => (
        <Card key={i}>
          <CardContent>
            <h3 className="text-lg font-medium mb-2">{s.name}</h3>
            <RadarMetric student={s} />
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
