CREATE CONSTRAINT `ID_ProcessRun_uniq` IF NOT EXISTS
FOR (n: `ProcessRun`)
REQUIRE (n.`ID`) IS UNIQUE;
CREATE CONSTRAINT `id_SurveyPeriod_uniq` IF NOT EXISTS
FOR (n: `SurveyPeriod`)
REQUIRE (n.`id`) IS UNIQUE;
CREATE CONSTRAINT `metric_id_Metric_uniq` IF NOT EXISTS
FOR (n: `Metric`)
REQUIRE (n.`metric_id`) IS UNIQUE;
CREATE CONSTRAINT `id_Group_uniq` IF NOT EXISTS
FOR (n: `Group`)
REQUIRE (n.`id`) IS UNIQUE;
CREATE CONSTRAINT `id_Affiliation_uniq` IF NOT EXISTS
FOR (n: `Affiliation`)
REQUIRE (n.`id`) IS UNIQUE;
CREATE CONSTRAINT `participant_id_Participant_uniq` IF NOT EXISTS
FOR (n: `Participant`)
REQUIRE (n.`participant_id`) IS UNIQUE;
CREATE CONSTRAINT `survey_instance_id_Response_uniq` IF NOT EXISTS
FOR (n: `Response`)
REQUIRE (n.`survey_instance_id`) IS UNIQUE;