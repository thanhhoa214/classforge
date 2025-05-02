import { Suspense } from "react";
import { NetworkType } from "@prisma/client";
import { NetworkTypeSelector } from "@/app/(dashboard)/network/components/network-type-selector";
import { NetworkLoading } from "@/app/(dashboard)/network/components/network-loading";
import { NetworkVisualization } from "@/app/(dashboard)/network/components/network-visualization";
import { getNetworkData } from "@/app/actions/network";
import Neo4j from "./components/neo4j";

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: NetworkType }>;
}) {
  const type = (await searchParams).type || NetworkType.FRIENDSHIP;
  const data = await getNetworkData(type);

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Social Network Analysis</h1>
      <div className="mb-4">
        <Neo4j />
        <NetworkTypeSelector currentType={type} />
      </div>
      <div className="flex-1 border rounded-lg overflow-hidden">
        <Suspense fallback={<NetworkLoading />}>
          <NetworkVisualization data={data} />
        </Suspense>
      </div>
    </>
  );
}
