"use client";
import { useEffect } from "react";

export default function Neo4j() {
  useEffect(() => {
    async function draw() {
      const neo4j = await import("neo4j-driver-lite");
      const driver = neo4j.driver(
        "neo4j+s://e737894e.databases.neo4j.io",
        neo4j.auth.basic("neo4j", "ZMRSwIxV-TRAcC6tTnVsMsneqz5wfc0nSbYG6p4RBXg")
      );

      driver
        .verifyConnectivity()
        .then(async function () {
          // Start the generation using parameter as root label of the query.
          const result = await driver.executeQuery(
            "MATCH (n1:Participant)-[r:get_advice]-(n2:Participant) RETURN n1, r, n2 LIMIT 25"
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
