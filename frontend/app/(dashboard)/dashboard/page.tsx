"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BarChart3 } from "lucide-react";
import Processes from "../allocations/components/processes";
import NetworkOverview from "./NetworkOverview";
import { FetchClient } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { formatNumber } from "@/lib/utils";
import { Suspense } from "react";

export default function DashboardPage() {
  const { data: participantCount } = useQuery({
    queryKey: ["metrics", "participants"],
    queryFn: () => FetchClient.GET("/metrics/participants"),
  });

  const { data: relationshipCount } = useQuery({
    queryKey: ["metrics", "relationships"],
    queryFn: () => FetchClient.GET("/metrics/relationships"),
  });

  const metrics = [
    {
      title: "Total Students",
      value: formatNumber(participantCount?.data?.participant_count || 0),
      icon: Users,
      description: "Active students in the system",
    },
    {
      title: "Active Allocations",
      value: 4,
      icon: GraduationCap,
      description: "Current classroom allocations",
    },
    {
      title: "Total Relationships",
      value: formatNumber(relationshipCount?.data?.relationship_count || 0),
      icon: BarChart3,
      description: "Total relationships in the system",
    },
  ];

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
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className="size-4.5 text-muted-foreground" />
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

      <div className="mt-8 flex flex-col md:flex-row items-start gap-4 *:w-1/2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <Processes />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Toggle students to view their connections
            </p>
            <Suspense fallback={<div>Loading...</div>}>
              <NetworkOverview />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
