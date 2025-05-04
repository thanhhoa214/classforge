import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, Users, GraduationCap, BarChart3 } from "lucide-react";

const metrics = [
  {
    title: "Total Students",
    value: "1,234",
    icon: Users,
    description: "Active students in the system",
  },
  {
    title: "Network Density",
    value: "73%",
    icon: Network,
    description: "Average connection density",
  },
  {
    title: "Active Allocations",
    value: "12",
    icon: GraduationCap,
    description: "Current classroom allocations",
  },
  {
    title: "Performance Score",
    value: "85%",
    icon: BarChart3,
    description: "Overall system performance",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your classroom allocation system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent allocations to display.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Network visualization will be displayed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
