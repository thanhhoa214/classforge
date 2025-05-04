MATCH (p:Participant)-[r:spend_more_time{
    run_id:$run_id
}]->(t:Participant)
RETURN 
    p.participant_id AS `Source`,
    t.participant_id AS `Target`
