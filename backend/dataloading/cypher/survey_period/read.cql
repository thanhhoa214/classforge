MATCH (s:SurveyPeriod)
RETURN 
    s.id AS id,
    s.survey_name AS survey_name,
    s.description AS description,
    s.file_name AS file_name
ORDER BY s.id
