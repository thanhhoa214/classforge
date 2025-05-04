MATCH (p:Participant {participant_id: $source}), 
      (f:Participant {participant_id: $target})
MERGE (p)-[r:disrespect {
    run_id:$run_id 
}]->(f)