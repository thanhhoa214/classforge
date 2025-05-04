MATCH (r:ProcessRun {id: $run_id})
MERGE (s:SurveyPeriod {
    id: $id,
    survey_name: $survey_name,
    description: $description,
    filename: $file_name
})<-[:has_survey]-(r)

return s