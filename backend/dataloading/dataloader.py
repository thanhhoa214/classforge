import os
import pandas as pd
from dataloading.api import DB
from datetime import datetime
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", 
    handlers=[
        logging.StreamHandler()  # Output logs to the console
    ]
)

logger = logging.getLogger(__name__)

class DataLoader:
    def __init__(self, db, folder = "data", loaded_sheet = ["participants", "responses"]
                 , loaded_relationship = ["net_0_friends"]):
        self.folder = os.path.join(os.path.dirname(__file__), folder)
        self.db: DB = db
        self.loaded_sheet = loaded_sheet
        self.loaded_relationship = loaded_relationship
    
    def load_node_df(self, df, cypher):
        """
        Create node/ relationship in neo4j using the cypher query with data from the dataframe
        """

        processed = []
        for row in df.to_dict("records"):
            records, summary, keys = self.db.execute_query(cypher, row)
            key = keys[0]
            for rec in records:
                processed.append(rec[key])
        
        return processed

    def load_relationsihp_df(self, df, cypher, load_id):
        """
        Create relationship in neo4j using the cypher query with data from the dataframe
        The relationship is related to a particular load_id
        """
        processed = []
        for row in df.to_dict("records"):
            row["run_id"] = load_id
            records, summary, keys = self.db.execute_query(cypher, row)
        
    def load_excel_file(self, file_path, run_id):
        """
        Load an excel file and load pre-define sheets into neo4j nodes.

        This function use to break down all sheet in the excel file, find cypher based on sheetname and load the data
        into neo4j
        """
        excel = pd.ExcelFile(file_path)
        result = {}

        for sheet_name in excel.sheet_names:
            target_name = sheet_name.strip().lower()
            if target_name in self.loaded_sheet:

                df = excel.parse(sheet_name)
                df.columns = [col.strip().lower().replace(" ", "_").replace("-", "_") for col in df.columns]
                df = self.fill_nan_values(df)
                df['run_id'] = run_id

                cypher = self.db.load_cypher(node_type=target_name, query_type="create")

                record= self.load_node_df(df, cypher)
                result[sheet_name] = df

        return result

    def load_relationship_from_excel(self, file_path, run_id):
        """
        Load an excel file and load pre-define sheets into neo4j relationship.

        This function use to break down all sheet in the excel file, find cypher based on sheetname and load the data
        into neo4j

        """

        excel = pd.ExcelFile(file_path)
        relationships = {}
        for sheet_name in excel.sheet_names:
            target_sheet_name = sheet_name.strip().lower()

            if target_sheet_name in self.loaded_relationship:
                df = excel.parse(sheet_name)
                df.columns = [col.strip().lower().replace(" ", "_").replace("-", "_") for col in df.columns]
                df = self.fill_nan_values(df)

                cypher = self.db.load_cypher_relationship(relationship_name=target_sheet_name, query_type="create")

                if not cypher:
                    logger.info(f"Cypher not found for {target_sheet_name}")
                    continue
                
                self.load_relationsihp_df(df, cypher, run_id)
                relationships[target_sheet_name] = df
        return relationships

    def load_node(self, df:pd.DataFrame, node_type):

        insertedID = []
        for row in df.to_dict(orient = "records"):
            records, summary, keys =  self.db.query_node(node_type, "create", params=row)

            insertedID.append(records)

        return insertedID

    def get_last_process_run(self):
        cypher = """
        MATCH (r:ProcessRun)
        RETURN r
        ORDER BY r.created_at DESC
        LIMIT 1
        """
        records, summary, key = self.db.execute_query(cypher, {})
        return records[0][key[0]]['id'] if records else None
    
    def get_last_survey_period(self):
        cypher = """
        MATCH (s:SurveyPeriod)
        RETURN s
        ORDER BY s.created_at DESC
        LIMIT 1
        """
        records, summary, keys = self.db.execute_query(cypher, {})
        return records[0][keys[0]]['id'] if records else None

    def check_survey_loaded(self, filename):
        cypher = """
        MATCH (s:SurveyPeriod {filename: $filename})
        RETURN s
        LIMIT 1
        """

        record, summary, key = self.db.execute_query(cypher, {"filename": filename})
        return True if record else False

    def create_process_run(self, next_run_id, run_type = "initial_loading"):
        process_params = {
            "id": next_run_id,
            "name": f"Excel to CSV Data Loader",
            "run_type": run_type,
            "description": "Loading data from Excel sheets into the database",
            "start_date": datetime.now().isoformat(),
            "end_date": None,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        pr, _, _ = self.db.query_node('processrun', "create", params=process_params)

        return pr

    def create_patcipant_relationship(self, survey_period, df):
        cypher = """
        MATCH (p:Participant {participant_id: $participant_id}), (s:SurveyPeriod {id: $survey_period_id})
        CREATE (p)-[r:participated_in]->(s)

        """

        for row in df.to_dict(orient='records'):
            params = {
                "participant_id": row["participant_id"],
                "survey_period_id": survey_period
            }
            self.db.execute_query(cypher, params)

    def load_survey_data(self, filename):
        survey_loaded = self.check_survey_loaded(filename)

        logger.info(f"Survey data {filename} loaded: {survey_loaded}")

        if survey_loaded:
            logger.info(f"Survey data {filename} already loaded")
            return
        # logger.info(survey_loaded)
        file_path = os.path.join(self.folder, filename)

        if not os.path.exists(file_path):
            logger.info(f"File {file_path} not found")
            return
        
        logger.info(f"Loading survey data from {file_path}")

        get_last_process_run = self.get_last_process_run()

        if not get_last_process_run:
            next_run_id = 1
        else:
            next_run_id = get_last_process_run + 1

        pr = self.create_process_run(next_run_id)
        if not pr:
            logger.info(f"Failed to create process run {next_run_id}")
            return
        logger.info(f"Process run {next_run_id} created")
        
        last_survey_period = self.get_last_survey_period()
        if not last_survey_period:
            next_survey_period_id = 1
        else:
            next_survey_period_id = last_survey_period + 1

        survey_period_params = {
            "id": next_survey_period_id,
            "survey_name": "Student Survey - Jan",
            "description": filename,
            "file_name": filename,
            "run_id": next_run_id
        }

        survey_period, summary, key = self.db.query_node('survey_period', "create", params=survey_period_params)

        if survey_period:
            logger.info(f"Survey period {next_survey_period_id} created")
        else:
            logger.info(f"Failed to create survey period {next_survey_period_id}")
            return
        
        # Load the data from the excel file
        node_df = self.load_excel_file(file_path, run_id=next_run_id)
        logger.info(f"Loaded {len(node_df)} files from {file_path}")

        # load relationship
        relationship_df = self.load_relationship_from_excel(file_path, next_run_id)
        logger.info(f"Loaded {len(relationship_df)} relationships file from {file_path}")

        if "participants" in node_df:
            participant_df = node_df["participants"]
            participant_df["process_run_id"] = next_run_id
            participant_df["survey_period_id"] = next_survey_period_id
        
        else:
            logger.info("Participant sheet not found in the excel file")
            return
        
        self.create_patcipant_relationship(next_survey_period_id, participant_df)
        

        # check and create metrics

        metric_cypher = self.db.load_cypher(node_type="metrics", query_type="create")
        if not metric_cypher:
            logger.info("Metrics cypher not found")
            return

        metrics = self.load_node_df(participant_df, metric_cypher)

        logger.info(f"Loaded {len(participant_df)} metrics from {file_path}")
        
        logger.info(f"Loaded survey data from {file_path} successfully")

        # update the process run end date


    def load_test_data(self, filename):
        """
        Load test data from the test data_file
        """
        
        survey_loaded = self.check_survey_loaded(filename)

        logger.info(f"Survey data {filename} loaded: {survey_loaded}")

        if survey_loaded:
            logger.info(f"Survey data {filename} already loaded")
            return
        # logger.info(survey_loaded)
        file_path = os.path.join(self.folder, filename)

        if not os.path.exists(file_path):
            logger.info(f"File {file_path} not found")
            return
        
        logger.info(f"Loading survey data from {file_path}")

        get_last_process_run = self.get_last_process_run()

        if not get_last_process_run:
            next_run_id = 1
        else:
            next_run_id = get_last_process_run + 1

        pr = self.create_process_run(next_run_id)
        if not pr:
            logger.info(f"Failed to create process run {next_run_id}")
            return
        logger.info(f"Process run {next_run_id} created")
        
        # get + create survey period
        last_survey_period = self.get_last_survey_period()
        if not last_survey_period:
            next_survey_period_id = 1
        else:
            next_survey_period_id = last_survey_period + 1

        survey_period_params = {
            "id": next_survey_period_id,
            "survey_name": "Student Survey - Jan",
            "description": filename,
            "file_name": filename,
            "run_id": next_run_id
        }

        survey_period, summary, key = self.db.query_node('survey_period', "create", params=survey_period_params)

        if survey_period:
            logger.info(f"Survey period {next_survey_period_id} created")
        else:
            logger.info(f"Failed to create survey period {next_survey_period_id}")
            return
        
        # Load the data from the excel file
        node_df = self.load_excel_file(file_path, run_id=next_run_id)

        logger.info(f"Loaded {len(node_df)} files from {file_path}")

        # load relationship
        relationship_df = self.load_relationship_from_excel(file_path, next_run_id)
        logger.info(f"Loaded {len(relationship_df)} relationships file from {file_path}")

        if "participants" in node_df:
            participant_df = node_df["participants"]
            participant_df["process_run_id"] = next_run_id
            participant_df["survey_period_id"] = next_survey_period_id
        
        else:
            logger.info("Participant sheet not found in the excel file")
            return
        
        self.create_patcipant_relationship(next_survey_period_id, participant_df)
        

        # check and create metrics

        logger.info(f"Loaded {len(participant_df)} metrics from {file_path}")
        
        logger.info(f"Loaded survey data from {file_path} successfully")

        return node_df

    def get_participant_data(self):
        cypher = self.db.load_cypher(node_type="participants", query_type="read")

        return self.db.query_to_dataframe(cypher, {})

    def fill_nan_values(self, df: pd.DataFrame, int_fill: int = 0, float_fill: float = 0.0):
        """
        Fill NaN values in the dataframe with the given values
        """
        for col in df.columns:
            if pd.api.types.is_integer_dtype(df[col]):
                df[col] = df[col].fillna(int_fill).astype(int)
            elif pd.api.types.is_float_dtype(df[col]):
                df[col] = df[col].fillna(float_fill)
        return df
    
    def get_survey_data(self, process_run_id):
        cypher = self.db.load_cypher(node_type="survey_data", query_type="read")

        return self.db.query_to_dataframe(cypher, {"process_run_id": process_run_id})
    
    def get_affliation_data(self):
        cypher = self.db.load_cypher(node_type="affiliations", query_type="read")

        return self.db.query_to_dataframe(cypher, {})

    def get_relationship_data(self, process_run_id, output_df = None):
        if not output_df:
            output_df = {}
        read_sheets = self.loaded_relationship
        

        for sheet in read_sheets:
            cypher = self.db.load_cypher_relationship(relationship_name=sheet, query_type="read")
            if not cypher:
                logger.info(f"Cypher not found for {sheet}")
                continue
            
            df = self.db.query_to_dataframe(cypher, {"run_id": process_run_id})
            output_df[sheet] = df

        return output_df
    
    def get_data_from_survey(self):
        output_df = {}
        last_sp = self.get_last_survey_period()

        participant_df = self.get_participant_data()

        affiliation_df = self.get_affliation_data()

        cypher_last_sp_id = """
            MATCH (s:SurveyPeriod)<-[has_survey]-(pr:ProcessRun)
            WHERE s.id = $last_sp
            RETURN pr.id AS process_run_id
            ORDER BY pr.created_at DESC
            LIMIT 1
            """    
        process_run_id, _, _ = self.db.execute_query(cypher_last_sp_id, {"last_sp": last_sp})
        if not process_run_id:
            logger.info(f"No process run found for survey period {last_sp}")
            return None
        process_run_id = process_run_id[0]['process_run_id']

        survey_df = self.get_survey_data(process_run_id)
        if survey_df.empty:
            logger.info(f"No survey data found for process run {process_run_id}")
            return None
        
        # add relationship_data:
        relationship_df = self.get_relationship_data(process_run_id, output_df=output_df)

        for sheet in relationship_df:
            output_df[sheet] = relationship_df[sheet]

        output_df["participants"] = participant_df
        output_df["survey_data"] = survey_df
        output_df["affiliations"] = affiliation_df

        return output_df

    def create_data_metric_df(self, df: pd.DataFrame, run_id):
        cypher = """
        UNWIND $df_dict AS metric
        MATCH (p:Participant {participant_id: metric.participant_id})
        MATCH (pr:ProcessRun {id: $run_id})

        MERGE (p)<-[:has_metric]-(:Metric {
            friends_in_degree : metric.friends_in_degree, 
            friends_out_degree : metric.friends_out_degree, 
            friends_closeness : metric.friends_closeness, 
            friends_betweenness : metric.friends_betweenness, 
            advice_in_degree : metric.advice_in_degree, 
            advice_out_degree : metric.advice_out_degree, 
            advice_closeness : metric.advice_closeness, 
            advice_betweenness : metric.advice_betweenness, 
            disrespect_in_degree : metric.disrespect_in_degree, 
            disrespect_out_degree : metric.disrespect_out_degree, 
            disrespect_closeness : metric.disrespect_closeness, 
            disrespect_betweenness : metric.disrespect_betweenness, 
            moretime_in_degree : metric.moretime_in_degree, 
            moretime_out_degree : metric.moretime_out_degree, 
            moretime_closeness : metric.moretime_closeness, 
            moretime_betweenness : metric.moretime_betweenness, 
            influential_in_degree : metric.influential_in_degree, 
            influential_out_degree : metric.influential_out_degree, 
            influential_closeness : metric.influential_closeness, 
            influential_betweenness : metric.influential_betweenness, 
            academic_score : metric.academic_score, 
            mental_score : metric.mental_score, 
            social_score : metric.social_score
        }) <-[:computed_metric]- (pr)
        """

        df["run_id"] = run_id
        df.columns = map(str.lower, df.columns)
        rec, summary, keys = self.db.execute_query(cypher, {"df_dict": df.to_dict(orient="records"), "run_id": run_id})

        if summary and summary.counters:
            logger.info(f"Inserted {summary.counters.nodes_created} nodes and {summary.counters.relationships_created} relationships")

        return rec, summary, keys

    def create_new_survey_data(self, df: pd.DataFrame, run_id):
        cypher = """
        UNWIND $df_dict AS survey
        MATCH (p:Participant {participant_id: survey.participant_id})
        MATCH (pr:ProcessRun {id: survey.run_id})
        MERGE (p)<-[:has_data]-(:SurveyData {
            participant_id: survey.participant_id,
            manbox5_1       : survey.manbox5_1,
            manbox5_2       : survey.manbox5_2,
            manbox5_3       : survey.manbox5_3,
            manbox5_4       : survey.manbox5_4,
            manbox5_5       : survey.manbox5_5,
            isolated        : survey.isolated,
            women_different : survey.womendifferent,
            language        : survey.language,
            covid           : survey.covid,
            criticises      : survey.criticises,
            men_better_stem : survey.menbetterstem,
            pwi_wellbeing   : survey.pwi_wellbeing,
            intelligence1   : survey.intelligence1,
            intelligence2   : survey.intelligence2,
            soft            : survey.soft,
            opinion         : survey.opinion,
            nerds           : survey.nerds,
            comfortable     : survey.comfortable,
            future          : survey.future,
            bullying        : survey.bullying,
            perc_effort     : survey.perc_effort,
            attendance      : survey.attendance,
            perc_academic   : survey.perc_academic,
            current_class   : survey.assigned_class,
            nervous         : survey.nervous,
            hopeless        : survey.hopeless,
            restless        : survey.restless,
            depressed       : survey.depressed,
            tried           : survey.tried,
            worthless       : survey.worthless
        }) <-[:computed_data]-(pr)
        """

        df.columns = map(str.lower, df.columns)
        df["run_id"] = run_id
        rec, summary, keys = self.db.execute_query(cypher, {"df_dict": df.to_dict(orient="records"), "run_id": run_id})

        if summary.counters:
            logger.info(f"Inserted {summary.counters.nodes_created} nodes and {summary.counters.relationships_created} relationships")

        return rec, summary, keys

    def create_new_rela_table(self, df: pd.DataFrame, run_id):
        cypher = """
        UNWIND $df_dict AS rel
        MATCH (p1:Participant {participant_id: rel.source})
        MATCH (p2:Participant {participant_id: rel.target})

        FOREACH (_ IN CASE WHEN rel.relation = "friends" THEN [1] ELSE [] END |
        MERGE (p1)-[:has_friend {run_id: rel.run_id}]->(p2)
        )

        FOREACH (_ IN CASE WHEN rel.relation = "advice" THEN [1] ELSE [] END |
        MERGE (p1)-[:get_advice {run_id: rel.run_id}]->(p2)
        )

        FOREACH (_ IN CASE WHEN rel.relation = "moretime" THEN [1] ELSE [] END |
        MERGE (p1)-[:spend_more_time {run_id: rel.run_id}]->(p2)
        )

        FOREACH (_ IN CASE WHEN rel.relation = "influential" THEN [1] ELSE [] END |
        MERGE (p1)-[:has_influence {run_id: rel.run_id}]->(p2)
        )

        FOREACH (_ IN CASE WHEN rel.relation = "disrespect" THEN [1] ELSE [] END |
        MERGE (p1)-[:disrespect {run_id: rel.run_id}]->(p2)
        )
        """
        df["run_id"] = run_id
        df.columns = map(str.lower, df.columns)
        rec, summary, keys = self.db.execute_query(cypher, {"df_dict": df.to_dict(orient="records"), "run_id": run_id})

        if summary.counters:
            logger.info(f"Inserted {summary.counters.nodes_created} nodes and {summary.counters.relationships_created} relationships")

        return rec, summary, keys
    
    def load_agent_metric_df(self, runid):
        cypher = """
        MATCH (p:Participant)<-[:has_metric]-(m:Metric)<-[:computed_metric]-(pr:ProcessRun {id: $runid})
        RETURN
            p.participant_id AS `participant_id`,
            m.friends_in_degree  AS `friends_in_degree`,
            m.friends_out_degree  AS `friends_out_degree`,
            m.friends_closeness  AS `friends_closeness`,
            m.friends_betweenness  AS `friends_betweenness`,
            m.advice_in_degree  AS `advice_in_degree`,
            m.advice_out_degree  AS `advice_out_degree`,
            m.advice_closeness  AS `advice_closeness`,
            m.advice_betweenness  AS `advice_betweenness`,
            m.disrespect_in_degree  AS `disrespect_in_degree`,
            m.disrespect_out_degree  AS `disrespect_out_degree`,
            m.disrespect_closeness  AS `disrespect_closeness`,
            m.disrespect_betweenness  AS `disrespect_betweenness`,
            m.moretime_in_degree  AS `moretime_in_degree`,
            m.moretime_out_degree  AS `moretime_out_degree`,
            m.moretime_closeness  AS `moretime_closeness`,
            m.moretime_betweenness  AS `moretime_betweenness`,
            m.influential_in_degree  AS `influential_in_degree`,
            m.influential_out_degree  AS `influential_out_degree`,
            m.influential_closeness  AS `influential_closeness`,
            m.influential_betweenness  AS `influential_betweenness`,
            m.academic_score  AS `academic_score`,
            m.mental_score  AS `mental_score`,
            m.social_score  AS `social_score`
        """
        return self.db.query_to_dataframe(cypher, {"runid": runid})

    def load_agent_survey_df(self, runid):
        cypher = """
        MATCH (pr:ProcessRun)-[:computed_data]->(s:SurveyData)-[:has_data]->(p:Participant)
        WHERE pr.id = $process_run_id
        RETURN 
            p.participant_id    AS `Participant_ID`,
            s.manbox5_1         AS `Manbox5_1`,
            s.manbox5_2         AS `Manbox5_2`,
            s.manbox5_3         AS `Manbox5_3`,
            s.manbox5_4         AS `Manbox5_4`,
            s.manbox5_5         AS `Manbox5_5`,
            s.isolated          AS `isolated`,
            s.women_different   AS `WomenDifferent`,
            s.language          AS `language`,
            s.covid             AS `COVID`,
            s.criticises        AS `criticises`,
            s.men_better_stem   AS `MenBetterSTEM`,
            s.pwi_wellbeing     AS `pwi_wellbeing`,
            s.intelligence1     AS `Intelligence1`,
            s.intelligence2     AS `Intelligence2`,
            s.soft              AS `Soft`,
            s.opinion           AS `opinion`,
            s.nerds             AS `Nerds`,
            s.comfortable       AS `comfortable`,
            s.future            AS `future`,
            s.bullying          AS `bullying`,
            s.perc_effort       AS `Perc_Effort`,
            s.attendance        AS `Attendance`,
            s.perc_academic     AS `Perc_Academic`,
            s.current_class     AS `Assigned_Class`,
            s.nervous           AS `Nervous`,
            s.hopeless          AS `Hopeless`,
            s.restless          AS `Restless`,
            s.depressed         AS `Depressed`,
            s.tried             AS `Tried`,
            s.worthless         AS `Worthless`
        """

        return self.db.query_to_dataframe(cypher, {"process_run_id": runid})

    def load_agent_relationship_df(self, runid):
       cypher = """ MATCH (p1:Participant)-[r]->(p2:Participant)
        WHERE r.run_id = $runid
        WITH p1, p2, 
        CASE  
            WHEN type(r) = "has_friend" THEN "friends"
            WHEN type(r) = "get_advice" THEN "advice"
            WHEN type(r) = "spend_more_time" THEN "moretime"
            WHEN type(r) = "has_influence" THEN "influential"
            WHEN type(r) = "disrespect" THEN "disrespect"
            ELSE "unknown"
        END AS relation
        ORDER BY relation
        RETURN p1.participant_id AS source, 
                p2.participant_id AS target,
                relation
       """

       return self.db.query_to_dataframe(cypher, {"runid": runid})

    def create_agent_data(self, df_dict: dict[str, pd.DataFrame]) -> bool:
        """
        Create agent data by processing metrics, survey data, and relationships.
        """
        # Validate required keys
        if not self._validate_required_keys(df_dict, ["df", "predicted_links", "Y_pred_df"]):
            return False

        # Get the next process run ID
        last_run_id = self.get_last_process_run() + 1
        self.create_process_run(last_run_id, run_type="agent_data")
        
        # Process metrics
        if not self._process_metrics(df_dict["df"], last_run_id):
            return False

        # Process survey data
        if not self._process_survey_data(df_dict["Y_pred_df"], last_run_id):
            return False

        # Process relationships
        if not self._process_relationships(df_dict["predicted_links"], last_run_id):
            return False

        logger.info(f"Agent data creation completed successfully for run ID {last_run_id}")
        return True

    def _validate_required_keys(self, df_dict: dict[str, pd.DataFrame], required_keys: list[str]) -> bool:

        missing_keys = [key for key in required_keys if key not in df_dict]
        if missing_keys:
            logger.info(f"Missing required keys: {', '.join(missing_keys)}")
            return False
        return True

    def _process_metrics(self, df: pd.DataFrame, run_id: int) -> bool:
        df = self.fill_nan_values(df)
        _, summary, _ = self.create_data_metric_df(df, run_id)
        if not summary or not summary.counters or not summary.counters.nodes_created:
            logger.info(f"Failed to create metrics for run ID {run_id}")
            return False
        logger.info(f"Metrics created successfully for run ID {run_id}")
        return True

    def _process_survey_data(self, df: pd.DataFrame, run_id: int) -> bool:

        _, summary, _ = self.create_new_survey_data(df, run_id)
        if not summary or not summary.counters or not summary.counters.nodes_created:
            logger.info(f"Failed to create survey data for run ID {run_id}")
            return False
        logger.info(f"Survey data created successfully for run ID {run_id}")
        return True

    def _process_relationships(self, df: pd.DataFrame, run_id: int) -> bool:

        _, summary, _ = self.create_new_rela_table(df, run_id)
        if not summary or not summary.counters or not summary.counters.relationships_created:
            logger.info(f"Failed to create relationships for run ID {run_id}")
            return False
        logger.info(f"Relationships created successfully for run ID {run_id}")
        return True
    

    def get_agent_data(self) -> dict[str, pd.DataFrame]:
        """
        Get agent data from the database.
        """
        agent_data = {}
        last_run_id = self.get_last_process_run()

        if not last_run_id:
            logger.info("No process run found")
            return agent_data

        agent_data["metrics"] = self.load_agent_metric_df(last_run_id)
        agent_data["survey_data"] = self.load_agent_survey_df(last_run_id)
        agent_data["relationships"] = self.load_agent_relationship_df(last_run_id)

        return agent_data
    
    def agent_sample_load(self):

        last_pr = self.get_last_process_run()
        if last_pr == 2:
            logger.info("Agent data already loaded")
            return

        test_df = pd.read_excel(os.path.join(self.folder,"test_df/df.xlsx"))
        predicted_df = pd.read_excel(os.path.join(self.folder, "test_df/predicted_links.xlsx"))
        y_pred_df = pd.read_excel(os.path.join(self.folder, "test_df/Y_pred_df.xlsx"))


        test_df.columns = map(str.lower, test_df.columns)
        test_df = self.fill_nan_values(test_df)
        test_df['run_id'] = 2
        self.create_process_run(2)
        self.create_data_metric_df(test_df, 2)

        y_pred_df.columns = map(str.lower, y_pred_df.columns)
        y_pred_df = self.fill_nan_values(y_pred_df)
        self.create_new_survey_data(y_pred_df, 2)

        predicted_df = self.fill_nan_values(predicted_df)
        predicted_df.columns = map(str.lower, predicted_df.columns)
        self.create_new_rela_table(predicted_df, 2)

        logger.info("Agent data loaded successfully")
    
    # 1. function for route getting latest process id

    # 2. Route function for metrics of a process id


    # 3. Each Route function for getting  statistic of all platforms (participant count, process count, relationship count, ...)