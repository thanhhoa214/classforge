import { Suspense } from "react";
import NetworkPage from "./components/network-page";
import Neo4j from "./components/neo4j";

export default function Page() {
  return (
    <>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Loading network visualization...
              </p>
            </div>
          </div>
        }
      >
        <Neo4j />
        <NetworkPage />
      </Suspense>
    </>
  );
}
