MATCH (p:Participant {participant_id: $source}), 
      (f:Participant {participant_id: $target})
MERGE (p)-[r:has_friend{
    run_id:$run_id 
}]->(f)