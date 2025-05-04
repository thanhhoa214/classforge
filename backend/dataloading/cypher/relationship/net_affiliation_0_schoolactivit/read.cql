MATCH (s:Participant)-[r:join_affiliation{
    run_id:$run_id
}]->(t:Affiliation)
RETURN 
    s.participant_id AS `Participant-ID`,
    t.Title AS `Activity`