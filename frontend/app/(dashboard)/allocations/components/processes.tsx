"use client";
import { neo4jDriver, ProcessNode } from "@/lib/neo4j";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRightFromSquareIcon } from "lucide-react";
import Link from "next/link";
import { startCase } from "lodash-es";

export default function Processes() {
  const { data } = useQuery({
    queryKey: ["processes"],
    queryFn: async () => {
      const query = `MATCH (pr:ProcessRun) ORDER BY pr.run_id DESC RETURN pr`;
      const result = await neo4jDriver.executeQuery(query);
      return result.records.map((record) => {
        const processRun = record.get("pr") as ProcessNode;
        return processRun.properties;
      });
    },
  });
  console.log(data);

  return (
    <ul className="flex flex-col gap-2">
      {data?.map((processRun) => (
        <li key={processRun.id.low}>
          <Link
            href={`/students?rid=${processRun.id.low}`}
            className="rounded-md border p-4 flex flex-col bg-primary/5 hover:bg-primary/10 transition-colors relative"
          >
            <ArrowUpRightFromSquareIcon
              className="absolute right-4 top-4 text-muted-foreground"
              size={20}
            />
            <ul className="text-xs mb-2">
              <li className="px-2 py-0.5 rounded-full bg-green-100 border border-green-700 inline-block">
                {startCase(processRun.run_type)}
              </li>
            </ul>
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  #{processRun.id.low} {processRun.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {processRun.description}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(processRun.created_at).toLocaleString()}
              </span>
            </div>
          </Link>
        </li>
      )) ?? (
        <li className="text-sm text-muted-foreground">
          No recent allocations to display.
        </li>
      )}
    </ul>
  );
}
