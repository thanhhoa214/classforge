MATCH (p:Participant {participant_id: $source}), 
      (f:Affiliation {id: $target})
MERGE (p)-[r:join_affiliation{
    run_id:$run_id
}]->(f)