import os
import pandas as pd
from api import DB
from datetime import datetime

class DataLoader:
    def __init__(self, db, folder = "data", loaded_sheet = ["participants", "responses"]
                 , loaded_relationship = ["net_0_friends"]):
        self.folder = folder
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
            print(summary.counters)
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
                df = df.astype(str)
                df['run_id'] = run_id

                cypher = self.db.load_cypher(node_type=target_name, query_type="create")

                record= self.load_node_df(df, cypher)
                if target_name == "responses":
                    print(record)
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
                df = df.astype(str)

                cypher = self.db.load_cypher_relationship(relationship_name=target_sheet_name, query_type="create")

                if not cypher:
                    print(f"Cypher not found for {target_sheet_name}")
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

    def create_process_run(self, next_run_id):
        process_params = {
            "id": next_run_id,
            "name": f"Excel to CSV Data Loader",
            "run_type": "loading",
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

        print(f"Survey data {filename} loaded: {survey_loaded}")

        if survey_loaded:
            print(f"Survey data {filename} already loaded")
            return
        # print(survey_loaded)
        file_path = os.path.join(self.folder, filename)

        if not os.path.exists(file_path):
            print(f"File {file_path} not found")
            return
        
        print(f"Loading survey data from {file_path}")

        get_last_process_run = self.get_last_process_run()

        if not get_last_process_run:
            next_run_id = 1
        else:
            next_run_id = get_last_process_run + 1

        pr = self.create_process_run(next_run_id)
        if not pr:
            print(f"Failed to create process run {next_run_id}")
            return
        print(f"Process run {next_run_id} created")
        
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
            print(f"Survey period {next_survey_period_id} created")
        else:
            print(f"Failed to create survey period {next_survey_period_id}")
            return
        
        # Load the data from the excel file
        node_df = self.load_excel_file(file_path, run_id=next_run_id)
        print(f"Loaded {len(node_df)} files from {file_path}")

        # load relationship
        relationship_df = self.load_relationship_from_excel(file_path, next_run_id)
        print(f"Loaded {len(relationship_df)} relationships file from {file_path}")

        if "participants" in node_df:
            participant_df = node_df["participants"]
            participant_df["process_run_id"] = next_run_id
            participant_df["survey_period_id"] = next_survey_period_id
        
        else:
            print("Participant sheet not found in the excel file")
            return
        
        self.create_patcipant_relationship(next_survey_period_id, participant_df)
        

        # check and create metrics

        metric_cypher = self.db.load_cypher(node_type="metrics", query_type="create")
        if not metric_cypher:
            print("Metrics cypher not found")
            return

        metrics = self.load_node_df(participant_df, metric_cypher)

        print(f"Loaded {len(participant_df)} metrics from {file_path}")
        
        print(f"Loaded survey data from {file_path} successfully")

        # update the process run end date


    def load_test_data(self, filename):
        """
        Load test data from the test data_file
        """
        
        survey_loaded = self.check_survey_loaded(filename)

        print(f"Survey data {filename} loaded: {survey_loaded}")

        if survey_loaded:
            print(f"Survey data {filename} already loaded")
            return
        # print(survey_loaded)
        file_path = os.path.join(self.folder, filename)

        if not os.path.exists(file_path):
            print(f"File {file_path} not found")
            return
        
        print(f"Loading survey data from {file_path}")

        get_last_process_run = self.get_last_process_run()

        if not get_last_process_run:
            next_run_id = 1
        else:
            next_run_id = get_last_process_run + 1

        pr = self.create_process_run(next_run_id)
        if not pr:
            print(f"Failed to create process run {next_run_id}")
            return
        print(f"Process run {next_run_id} created")
        
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
            print(f"Survey period {next_survey_period_id} created")
        else:
            print(f"Failed to create survey period {next_survey_period_id}")
            return
        
        # Load the data from the excel file
        node_df = self.load_excel_file(file_path, run_id=next_run_id)
        print(node_df)
        print(f"Loaded {len(node_df)} files from {file_path}")

        # load relationship
        relationship_df = self.load_relationship_from_excel(file_path, next_run_id)
        print(f"Loaded {len(relationship_df)} relationships file from {file_path}")

        if "participants" in node_df:
            participant_df = node_df["participants"]
            participant_df["process_run_id"] = next_run_id
            participant_df["survey_period_id"] = next_survey_period_id
        
        else:
            print("Participant sheet not found in the excel file")
            return
        
        self.create_patcipant_relationship(next_survey_period_id, participant_df)
        

        # check and create metrics

        print(f"Loaded {len(participant_df)} metrics from {file_path}")
        
        print(f"Loaded survey data from {file_path} successfully")

        return node_df

    def get_participant_data(self):
        cypher = self.db.load_cypher(node_type="participants", query_type="read")

        return self.db.query_to_dataframe(cypher, {})
    
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
                print(f"Cypher not found for {sheet}")
                continue
            
            df = self.db.query_to_dataframe(cypher, {"process_run_id": process_run_id})
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
            print(f"No process run found for survey period {last_sp}")
            return None
        process_run_id = process_run_id[0]['process_run_id']


        survey_df = self.get_survey_data(process_run_id)
        if survey_df.empty:
            print(f"No survey data found for process run {process_run_id}")
            return None
        
        # add relationship_data:
        self.get_relationship_data(process_run_id, output_df=output_df)

        output_df["participants"] = participant_df
        output_df["survey_data"] = survey_df
        output_df["affiliations"] = affiliation_df

        return output_df





    