MATCH (p:Participant {participant_id: $source}), 
      (f:Participant {participant_id: $target})
MERGE (p)-[r:spend_more_time {
    run_id:$run_id 
}]->(f)