MATCH (p:Participant)
RETURN 
    p.participant_id AS `Participant-ID`
,   "Participant" AS `Type`
,   p.first_name AS `First-Name`
,   p.last_name AS `Last-Name`
,   p.email AS Email
,   p.perc_effort AS Perc_Effort
,   p.attendance AS Attendance
,   p.perc_academic AS Perc_Academic
,   p.completeyears AS CompleteYears
,   p.house AS House
ORDER BY p.participant_id