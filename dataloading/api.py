import dotenv
import pyvis
import json
import os
from neo4j import GraphDatabase
import pandas as pd

def main():
    load_status = dotenv.load_dotenv("db.env")
    if load_status is False:
        raise RuntimeError('Environment variables not loaded.')

    URI = os.getenv("NEO4J_URI")
    AUTH = (os.getenv("NEO4J_USERNAME"), os.getenv("NEO4J_PASSWORD"))

    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        driver.verify_connectivity()
        print("Connection established.")
        db = DB(driver)
        

class DB:
    def __init__(self):
        self.database = ""
        self.driver: GraphDatabase.driver = None
        self.cypher_path = os.path.join(os.path.dirname(__file__), "cypher")
        self.cache = {}
    
    def connect(self, file_name = "db.env"):
        load_status = dotenv.load_dotenv(file_name)
        if load_status is False:
            raise RuntimeError('Environment variables not loaded.')

        URI = os.getenv("NEO4J_URI")
        AUTH = (os.getenv("NEO4J_USERNAME"), os.getenv("NEO4J_PASSWORD"))

        with GraphDatabase.driver(URI, auth=AUTH) as driver:
            driver.verify_connectivity()
            print("Connection established.")
            self.driver = driver

    def close(self):
        self.driver.close()
    
    def execute_query(self, cypher, params):
        records, summary, keys = None, None, None
        try:
            records, summary, keys = self.driver.execute_query(
            cypher
            , params
        )
        except Exception as e:
            print("Failed to execute query: ", e)
        
        return records, summary, keys
    
    def query(self, cypher, params = None):
        if not params:
            params = {}

        records, summary, keys = None, None, None

        try:
            records, summary, keys = self.driver.execute_query(
                cypher, params
            )
        except Exception as e:
            print("Failed to query: ", e)

        return records, summary, keys

    def query_kwargs(self, cypher, **kwargs):
        records, summary, keys = None, None, None

        try:
            records, summary, keys = self.driver.execute_query(
                cypher, **kwargs
            )
        except Exception as e:
            print("Failed to query: ", e)

        return records, summary, keys


    def visualize_result(self, query_graph, nodes_text_properties):
        visual_graph = pyvis.network.Network()

        for node in query_graph.nodes:
            node_label = list(node.labels)[0]
            node_text = node[nodes_text_properties[node_label]]
            visual_graph.add_node(node.element_id, node_text, group=node_label)

        for relationship in query_graph.relationships:
            visual_graph.add_edge(
                relationship.start_node.element_id,
                relationship.end_node.element_id,
                title=relationship.type
            )

        visual_graph.show('network.html', notebook=False)

    
    def load_cypher(self, node_type = None, query_type = None, cypher_file_path = None):
        print(f"Loading cypher for {node_type} with operation {query_type}")
        if not cypher_file_path:
            cypher_file_path = os.path.join(self.cypher_path, node_type, query_type + ".cql")
        
        if cypher_file_path in self.cache:
            return self.cache[cypher_file_path] 
        
        if not os.path.isfile(cypher_file_path):
            print("File not exists, cannot open. Check the path {cypher_file_path}")
            return None

        with open(cypher_file_path) as f:
            cypher = f.read()
        f.close()
        
        self.cache[cypher_file_path] = cypher

        return cypher
    
    def load_cypher_relationship(self, relationship_name = None, query_type = None, cypher_file_path = None):
        """
        Load cypher for relationship based on the relationship name and query type.         
        """
        if relationship_name and query_type:
            cypher_file_path = os.path.join(self.cypher_path, "relationship", relationship_name, query_type + ".cql")
        elif cypher_file_path:
            cypher_file_path = os.path.join(self.cypher_path, "relationship", cypher_file_path)
        else:
            raise ValueError("Either relationship_name and query_type or cypher_file_path must be provided.")
        
        if cypher_file_path in self.cache:
            return self.cache[cypher_file_path]
        
        if not os.path.isfile(cypher_file_path):
            print(f"File not exists, cannot open. Check the path {cypher_file_path}")
            return None
        with open(cypher_file_path) as f:
            cypher = f.read()
        f.close()
        self.cache[cypher_file_path] = cypher

        return cypher
    

    def query_node(self, node_type, query_type, params, cypher_file_path = None):
        cypher = self.load_cypher(node_type, query_type, cypher_file_path)

        if not cypher:
            raise (f"No cypher file query for nodetype {node_type} with operation {query_type}")
        
        return self.execute_query(cypher, params)
    
    def query_to_dataframe(self, cypher: str, params: dict = None) -> pd.DataFrame:
        """
        Execute a Cypher query and return results as a DataFrame.
        """
        records, _, keys = self.execute_query(cypher, params or {})
        rows = [{k: rec[k] for k in keys} for rec in records or []]
        return pd.DataFrame(rows)

    def query_node_df(
        self,
        node_type: str,
        query_type: str,
        params: dict = None,
        cypher_file_path: str = None
    ) -> pd.DataFrame:
        """
        Load a node‐based Cypher from file, execute it, and return a DataFrame.
        """
        cypher = self.load_cypher(node_type, query_type, cypher_file_path)
        if not cypher:
            raise ValueError(f"No cypher for {node_type}.{query_type}")
        return self.query_to_dataframe(cypher, params)

if __name__ == "__main__":
    main()
