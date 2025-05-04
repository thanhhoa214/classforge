MATCH (p:Participant {participant_id: $participant_id})
MATCH (r:ProcessRun {id: $process_run_id})
MERGE (p) <-[:for_participant]-(m:Metric {
    attendance: $attendance
    , perc_academic: $perc_academic
    , perc_effort: $perc_effort
}) <-[:computed_metric]-(r)
RETURN m.id