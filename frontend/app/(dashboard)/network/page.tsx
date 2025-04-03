import { Suspense } from "react";
import { NetworkType } from "@prisma/client";
import { getNetworkData } from "../../actions/network";
import { NetworkTypeSelector } from "@/app/(dashboard)/network/components/network-type-selector";
import { NetworkLoading } from "@/app/(dashboard)/network/components/network-loading";
import { NetworkVisualization } from "@/app/(dashboard)/network/components/network-visualization";

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
