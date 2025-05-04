MATCH (p:Participant {participant_id: $source}), 
      (f:Participant {participant_id: $target})
MERGE (p)-[r:has_influence{
    run_id:$run_id 
}]->(f)