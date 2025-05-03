MATCH (p:Participant {participant_id: $participant_id})
MERGE (p)-[r1:has_response]->(r:Response {
survey_instance_id: $survey_instance_id
, status: $status
, manbox5_1: $manbox5_1
, manbox5_2: $manbox5_2
, manbox5_3: $manbox5_3
, manbox5_4: $manbox5_4
, manbox5_5: $manbox5_5
, isolated: $isolated
, womendifferent: $womendifferent
, manbox5_overall: $manbox5_overall
, language: $language
, masculinity_contrained: $masculinity_contrained
, growthmindset: $growthmindset
, covid: $covid
, criticises: $criticises
, menbetterstem: $menbetterstem
, school_support_engage6: $school_support_engage6
, pwi_wellbeing: $pwi_wellbeing
, intelligence1: $intelligence1
, intelligence2: $intelligence2
, soft: $soft
, opinion: $opinion
, nerds: $nerds
, school_support_engage: $school_support_engage
, comfortable: $comfortable
, future: $future
, bullying: $bullying
, candidate_perc_effort: $candidate_perc_effort
})

return r
