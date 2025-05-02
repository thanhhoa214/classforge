MATCH (p:Participant {participant_id: $source}), 
      (f:Participant {participant_id: $target})
MERGE (p)-[r:get_advice {
    run_id:$run_id 
}]->(f)