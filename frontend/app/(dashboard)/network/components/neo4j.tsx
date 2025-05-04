"use client";
import { neo4jDriver } from "@/lib/neo4j";
import { useEffect } from "react";

export default function Neo4j() {
  useEffect(() => {
    async function draw() {
      neo4jDriver
        .verifyConnectivity()
        .then(async function () {
          // Start the generation using parameter as root label of the query.
          const result = await neo4jDriver.executeQuery(
            "MATCH (n1:Participant)-[r]-(n2:Participant) RETURN n1, r, n2 LIMIT 25"
          );
          console.log(result);
        })
        .catch(function (error) {
          console.error(error);
        });
    }

    draw();
  }, []);

  return null;
}
