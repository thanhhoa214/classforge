MERGE (p:Participant {participant_id: $participant_id
, first_name: $first_name
, last_name: $last_name
, email: $email
, house: $house
, attendance: $attendance
, perc_academic: $perc_academic
, perc_effort: $perc_effort
, completeyears: $completeyears})

return p.participant_id