import os
import pandas as pd
import networkx as nx
from dotenv import load_dotenv
from langchain.tools import Tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, BaseMessage
from pydantic import BaseModel
from typing import List
#from agent_swap_class import reallocate_student_to_class
from langchain_core.messages import SystemMessage
# from algorithm.agent_swap_class import reallocate_student_to_class
from services.db import get_db
from services.loader import get_loader
from dataloading.dataloader import DataLoader

from algorithm.feature_engineer import (build_updated_net_dict,
                              compute_sna_features_from_graphs,
                              compute_predicted_wellbeing_scores)

from algorithm.cp_sat import apply_thresholds_from_classes

import joblib

class GraphAgentState(BaseModel):
    messages: List[BaseMessage]


load_dotenv("algorithm/key.env", override=True)

# Put your OpenAI API key here
api_key = os.getenv("OPENAI_API_KEY")
llm = ChatOpenAI(api_key=api_key, model="gpt-4o", temperature=0)

def parse_user_input(user_text: str, graph_meta: str) -> GraphAgentState:
    return GraphAgentState(messages=[
    SystemMessage(content=graph_meta + "\n\n" + 
    "To answer questions, use the GraphQueryRunner tool with Python code like:\n"
    "Always store your answer in a variable called `result`."),
    HumanMessage(content=user_text.strip())
    ])

def reload_data_and_graph(columns_to_drop:List[str] = None, dl:DataLoader = None):
    print("Running get_reload_data_and_graph")
    df_output = dl.get_agent_data()

    df_predicted = df_output["Y_pred_df"].set_index("Participant_ID")
    df_wellbeing = df_output["df"].set_index("Participant_ID")
    edges = df_output["predicted_links"]

    df_nodes = df_predicted.join(df_wellbeing, how="outer")

    # Drop unused columns again
    df_nodes.drop(columns=columns_to_drop, errors='ignore', inplace=True)
    df_nodes.rename(columns={
        "academic_score": "Academic_Wellbeing_Score",
        "mental_score": "Mental_Wellbeing_Score",
        "social_score": "Social_Wellbeing_Score",
        "Perc_Academic": "Academic_Grade_Percent",
        "Perc_Effort": "Effort_Percent",
        "Attendance": "Attendance_Percent"
    }, inplace=True)


    # Assign new nodes
    G_new = nx.MultiDiGraph()

    for _, row in edges.iterrows():
        u, v, rel = row["Source"], row["Target"], row["Relation"]
        G_new.add_edge(u, v, relation=rel)

    # Assign node attributes from df_nodes
    for node_id, attrs in df_nodes.to_dict(orient="index").items():
        if G_new.has_node(node_id):
            G_new.nodes[node_id].update(attrs)

    return G_new, df_nodes, df_predicted, df_wellbeing, edges

def run_agent(query):
    print("Running run_agent")
    dl = get_loader()   

    columns_to_drop = [
    "Manbox5_1", "Manbox5_2", "Manbox5_3", "Manbox5_4", "Manbox5_5", "isolated",
    "WomenDifferent", "language", "COVID", "criticises", "MenBetterSTEM",
    "pwi_wellbeing", "Intelligence1", "Intelligence2", "Soft", "opinion",
    "Nerds", "comfortable", "future", "bullying", "Nervous"]

    graph, df_nodes, df_predicted, df_wellbeing, edges =  reload_data_and_graph(columns_to_drop, dl)


    graph_container = {"G": graph}

    print(f"Prepared node attribute DataFrame with shape: {df_nodes.shape}")
    print(f"Graph built with {graph.number_of_nodes()} nodes and {graph.number_of_edges()} edges.")

    def run_graph_query(code: str) -> str:
        print("Running run_graph_query")
        local_vars = {}
        global_vars = {"G": graph_container["G"], "nx": nx}

        try:
            exec(code, global_vars, local_vars)
            return str(local_vars.get("result", global_vars.get("result", "Code executed but no result returned.")))
        except Exception as e:
            return f"Error: {str(e)}"

    graph_query_tool = Tool(
    name="GraphQueryRunner",
    func=run_graph_query,
    # func_kwargs={"graph_container": graph_container},
    description="Run Python NetworkX code using graph `G`. Use variable `G` and store result in `result`."
    )

    agent_node = create_react_agent(
    tools=[graph_query_tool],
    model=llm
    )

    workflow = StateGraph(GraphAgentState)
    workflow.add_node("agent", agent_node)
    workflow.set_entry_point("agent")
    workflow.set_finish_point("agent")
    app = workflow.compile()

    graph_meta = """
    You are working with a directed social network graph `G` using NetworkX.

    • Each node is a student with attributes:
    - Academic_Grade_Percent, Effort_Percent, Attendance_Percent
    - Academic_Wellbeing_Score, Mental_Wellbeing_Score, Social_Wellbeing_Score
    - Assigned_Class

    • Each edge represents a directed social relationship (Source → Target) with:
    - Relation types: 'friends', 'disrespect', 'influential', 'advice', 'moretime', 'feedback'
    - moretime: "Source spend more time with target than others"
    - feedback: "Source recieve feedback from target"

    • When the user asks for support advice or a summary of a student:
    - Focus on what matters for intervention or action (not raw statistics).
    - Compare the student's wellbeing and academic scores against common expectations or the class average.
    - Pay attention to effort, social connections, and any signs of risk (low scores, no friendships, being disrespected).
    - Use natural reasoning to explain *why* the student might need support.
    - Avoid listing full attributes unless essential. Do not repeat raw score values unless relevant to your suggestion.
    - Be brief: Ideally, use 3–5 bullet points with direct, actionable recommendations.
    - Start with 1–2 lines of context/observation, then list the support points.
    - Avoid scanning the full graph unless necessary. Focus on the specific student and their direct connections.

    Avoid repeating raw values unless useful. Emphasise key insights that lead to meaningful support decisions.
    Use Python code (via NetworkX) to query the graph and always store your answer in a variable named `result`
    """

    state = parse_user_input(query, graph_meta)

    output = app.invoke(state)
    final_msg = output.get("messages")[-1].content if "messages" in output else str(output) 

    print("Final message:", final_msg)

    if final_msg:
        return final_msg
    return ""


# Other part code
def load_allocate_original_data(dl: DataLoader):
    print("Running load_allocate_original_data")
    df_dict = dl.get_agent_data(load_completed_data_only=True)

    survey_outcome = df_dict["df"].set_index("Participant_ID")
    Y_pred_df = df_dict["Y_pred_df"].set_index("Participant_ID")
    predicted_link_df = df_dict["predicted_links"]

    # Load all models and configs from bundle
    model = joblib.load("survey_predictor.pkl")
    bundle = joblib.load("agent_models_bundle.pkl")

    survey_predictor = bundle["survey_predictor"]
    multilabel_link_model = bundle["multilabel_link_model"]
    embeddings = bundle["embeddings"]
    relation_to_label = bundle["relation_to_label"]
    relationship_weights = bundle["relationship_weights"]
    X_train_columns = bundle["X_train_columns"]
    Y_train_columns = bundle["Y_train_columns"]
    alloc_df = Y_pred_df[['Assigned_Class']].copy()

    return {
        "survey_outcome": survey_outcome,
        "predicted_link_df": predicted_link_df,
        "Y_pred_df": Y_pred_df,
        "model": model,
        "bundle": bundle,
        "multilabel_link_model": multilabel_link_model,
        "embeddings": embeddings,
        "relation_to_label": relation_to_label,
        "relationship_weights": relationship_weights,
        "X_train_columns": X_train_columns,
        "Y_train_columns": Y_train_columns,
        "alloc_df": alloc_df,
        'survey_predictor': survey_predictor
    }


def handle_reallocate_student(student_id: int, new_class: int) -> None:
        print("Running handle_reallocate_student")
        dl = get_loader()

        # df_before = pd.read_csv("df.csv", index_col="Participant_ID")

        df_dict = load_allocate_original_data(dl)

        df_before = df_dict["survey_outcome"].copy()
    
        scores_before = df_before.loc[[student_id], ["academic_score", "mental_score", "social_score"]]

        # Rewrite this function to get the data
        # Run reallocation and get updated results
        result = reallocate_student_to_class(student_id, new_class, df_data = df_dict)

        SNA_after = result['df_SNA']
        new_classes = result["Y_pred_df"]
        new_links = result["predicted_link_df"]
        scores_after = result['individual_scores']

        updated_class = result["Y_pred_df"].loc[student_id, "Assigned_Class"]
        print(f"\nStudent {student_id} is now in Class {updated_class}")
        print("\nWellbeing score changes:")
        print("Before:\n", scores_before.loc[student_id])
        print("After:\n", scores_after.loc[student_id])
        print("-" * 30)

        SNA_after["Participant_ID"] = SNA_after.index
        new_classes["Participant_ID"] = new_classes.index

        create_data = {
                "df": SNA_after,
                "Y_pred_df": new_classes,
                "predicted_links": new_links
            }

        run_id = dl.create_agent_data(df_dict= create_data)

        return run_id

        # new_classes.to_csv("Y_pred_df.csv", index=True)
        # SNA_after.to_csv("df.csv")
        # new_links.to_csv("predicted_links.csv", index=False)

        # Split this into two funcitons -> When ever relocate run -> ask for id + class

def save_reallocation(run_id:int = None):
    dl = get_loader()
    dl.update_last_process_run(run_id)

    return True, "Reallocation saved."


def reallocate_student_to_class(student_id: int, new_class: int, df_data: dict = None):
    print("Running reallocate_student_to_class")
    # Step 1: Gather data from df_data_dict
    model = df_data["model"]
    multilabel_link_model = df_data["multilabel_link_model"]
    embeddings = df_data["embeddings"]
    relation_to_label = df_data["relation_to_label"]
    relationship_weights = df_data["relationship_weights"]
    X_train_columns = df_data["X_train_columns"]
    Y_train_columns = df_data["Y_train_columns"]

    alloc_df = df_data['alloc_df']

    # === Step 2: Reassign student to new class
    alloc_df.loc[student_id, "Assigned_Class"] = new_class

    # === Step 3: Reapply threshold on new allocation
    relation_list = list(relation_to_label.keys())
    predicted_links = apply_thresholds_from_classes(
        embeddings=embeddings,
        model=multilabel_link_model,
        relation_list=relation_list,
        alloc_df=alloc_df,
        same_class_threshold=0.53,
        diff_class_threshold=0.69
    )

    # === Step 4: Rebuild graph + compute updated features
    net_dict_updated = build_updated_net_dict(alloc_df, predicted_links)
    X_post = compute_sna_features_from_graphs(net_dict_updated, relationship_weights).fillna(0)
    X_post = X_post.reindex(columns=X_train_columns, fill_value=0)
    X_post.index = alloc_df.index

    # === Step 5: Predict survey outcomes and wellbeing
    Y_pred = model.predict(X_post)
    Y_pred_df_local = pd.DataFrame(Y_pred, index=X_post.index, columns=Y_train_columns).fillna(0)
    wellbeing_df = compute_predicted_wellbeing_scores(Y_pred_df_local)

    # === Step 6: Report class-level and individual wellbeing
    class_avg = wellbeing_df.groupby(alloc_df["Assigned_Class"])[["academic_score", "social_score", "mental_score"]].mean()
    student_result = wellbeing_df.loc[[student_id]]

    # === Step 7: Construct predicted_link_df with class info
    index_to_pid = {i: pid for i, pid in enumerate(alloc_df.index)}
   # Flatten and convert Source/Target to actual Participant_IDs
    flattened_links = [
        (index_to_pid[u], index_to_pid[v], r) 
        for r, lst in predicted_links.items() 
        for u, v in lst
    ]
    predicted_link_df_local = pd.DataFrame(flattened_links, columns=["Source", "Target", "Relation"])

    # === Step 8: Store result in global last_result
    last_result = {
        "class_summary": class_avg, # Well-being summary per class
        "individual_scores": student_result, #class change outcome
        "df_SNA": X_post.join(wellbeing_df), #SNA metrics
        "Y_pred_df": Y_pred_df_local.join(alloc_df), # Survey + Assigned class
        "predicted_link_df": predicted_link_df_local # relationship
    }
    
    return last_result


# Return response, saved data
def run_agent_final(query: str = None, allocation_save = False, need_allocation = None):
    if need_allocation:
        student_id, new_class = need_allocation
        handle_reallocate_student(student_id, new_class)
        return True, "Reallocation completed."

    if allocation_save:
        save_reallocation()
        return True, "Reallocation saved."

    query = query.strip()

    if query.lower() in ["exit", "quit"]:
        return False, "Exiting the agent."
    
    try:
        response = run_agent(query)
        return False, response
    except Exception as e:
        print("Error:", str(e))
        return False, f"Error while processing the query: {str(e)}"

if __name__ == "__main__":
    pass
    # input_text = "What is the wellbeing of student 32392?"
    # response = run_agent_final(need_allocation=(32392, 2))
    # response = run_agent_final(need_allocation=(32392, 2))
    # print("Response:", response)

