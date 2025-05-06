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
from agent_swap_class import reallocate_student_to_class
from langchain_core.messages import SystemMessage

# NetworkX to build construct graph G + LangChain(with networkX) to execute a custom python code (to answer)
# GraphQuerytool to create an agent and Openai to parse the input and inteperet

# === Load API Key ===
load_dotenv("key.env", override=True)
api_key = os.getenv("OPENAI_API_KEY")
llm = ChatOpenAI(api_key=api_key, model="gpt-4o", temperature=0)

# Load all sources
df_predicted = pd.read_csv("Y_pred_df.csv", index_col="Participant_ID")    # Includes Assigned_Class, survey predictions
df_wellbeing = pd.read_csv("df.csv", index_col="Participant_ID")           # Includes academic, social, mental wellbeing scores

# Merge them into one node attribute DataFrame
df_nodes = df_predicted.join(df_wellbeing, how="outer")

# Optionally: drop irrelevant columns (if any)
columns_to_drop = [
    "Manbox5_1", "Manbox5_2", "Manbox5_3", "Manbox5_4", "Manbox5_5", "isolated",
    "WomenDifferent", "language", "COVID", "criticises", "MenBetterSTEM",
    "pwi_wellbeing", "Intelligence1", "Intelligence2", "Soft", "opinion",
    "Nerds", "comfortable", "future", "bullying", "Nervous"
]
df_nodes.drop(columns=columns_to_drop, errors='ignore', inplace=True)
df_nodes.rename(columns={
    "academic_score": "Academic_Wellbeing_Score",
    "mental_score": "Mental_Wellbeing_Score",
    "social_score": "Social_Wellbeing_Score",
    "Perc_Academic": "Academic_Grade_Percent",
    "Perc_Effort": "Effort_Percent",
    "Attendance": "Attendance_Percent"
}, inplace=True)

# Final check
edges = pd.read_csv("predicted_links.csv")
nodes = df_nodes


G = nx.MultiDiGraph()
graph_container = {"G": G}
for _, row in edges.iterrows():
    u, v, rel = row["Source"], row["Target"], row["Relation"]
    G.add_edge(u, v, relation=rel)
# Attach attributes from df_nodes to each node in G
for node_id, attrs in df_nodes.to_dict(orient="index").items():
    if G.has_node(node_id):
        G.nodes[node_id].update(attrs)
        
print(f"Prepared node attribute DataFrame with shape: {df_nodes.shape}")
print(f"Graph built with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges.")


# Step 1: Redefine function to accept graph
def run_graph_query(code: str) -> str:
    local_vars = {}
    global_vars = {"G": graph_container["G"], "nx": nx}

    try:
        exec(code, global_vars, local_vars)
        return str(local_vars.get("result", global_vars.get("result", "Code executed but no result returned.")))
    except Exception as e:
        return f"Error: {str(e)}"

# Step 2: Create Tool with graph bound
graph_query_tool = Tool(
    name="GraphQueryRunner",
    func=run_graph_query,
    description="Run Python NetworkX code using graph `G`. Use variable `G` and store result in `result`."
)

# Step 3: Now call create_react_agent safely
agent_node = create_react_agent(
    tools=[graph_query_tool],
    model=llm
)

# === State Schema ===
class GraphAgentState(BaseModel):
    messages: List[BaseMessage]

# === Build LangGraph Workflow ===
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
  - Relation types: 'friends', 'disrespect', 'influential', 'advice', 'moretime'
  - moretime: "Source spend more time with target than others"

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

# === Input Parser ===
def parse_user_input(user_text: str) -> GraphAgentState:
    return GraphAgentState(messages=[
    SystemMessage(content=graph_meta + "\n\n" + 
    "To answer questions, use the GraphQueryRunner tool with Python code like:\n"
    "Always store your answer in a variable called `result`."),
    HumanMessage(content=user_text.strip())
    ])
    
# === Refresh the df ===
def reload_data_and_graph():
    global df_predicted, df_wellbeing, df_nodes, G

    # Reload updated CSVs
    df_predicted = pd.read_csv("Y_pred_df.csv", index_col="Participant_ID")
    df_wellbeing = pd.read_csv("df.csv", index_col="Participant_ID")
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

    # Reload edges
    edges = pd.read_csv("predicted_links.csv")

    # Reload edges
    G_new = nx.MultiDiGraph()
    edges = pd.read_csv("predicted_links.csv")
    for _, row in edges.iterrows():
        u, v, rel = row["Source"], row["Target"], row["Relation"]
        G_new.add_edge(u, v, relation=rel)

    # Assign node attributes from df_nodes
    for node_id, attrs in df_nodes.to_dict(orient="index").items():
        if G_new.has_node(node_id):
            G_new.nodes[node_id].update(attrs)

    # Update graph reference in container
    graph_container["G"] = G_new
    print("Graph and data reloaded.")
 
# Re-allocate students and evaluate
def handle_reallocate_student() -> None:
    try:
        student_id = int(input("Enter the student ID: ").strip())
        new_class = int(input("Enter the new class to assign: ").strip())

        # Load original wellbeing scores
        df_before = pd.read_csv("df.csv", index_col="Participant_ID")
        scores_before = df_before.loc[[student_id], ["academic_score", "mental_score", "social_score"]]

        # Run reallocation and get updated results
        result = reallocate_student_to_class(student_id, new_class)

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

        # Ask to save
        save = input("Do you want to save this reallocation and update the graph? (yes/no): ").strip().lower()
        if save == "yes":
            new_classes.to_csv("Y_pred_df.csv", index=True)
            SNA_after.to_csv("df.csv")
            new_links.to_csv("predicted_links.csv", index=False)
            print("Reallocation saved. Reloading graph...")
            reload_data_and_graph()
        else:
            print("Changes discarded. No files updated.")

    except Exception as e:
        print(f"Error while reallocating student: {e}")

# === Run Interactive Session ===
if __name__ == "__main__":
    print("LangGraph Agent Ready. Ask your graph question (type 'exit' to quit).\n")
    while True:
        query = input("Ask your LangGraph Agent: ").strip()
        if query.lower() in ["exit", "quit"]:
            break
        elif any(x in query.lower() for x in ["swap", "reallocate", "re-allocate", "switch class", 'reassign']):
            handle_reallocate_student()
            continue
        try:
            state = parse_user_input(query)
            output = app.invoke(state)
            final_msg = output.get("messages")[-1].content if "messages" in output else str(output)
            print("\nAnswer:", final_msg, "\n")
        except Exception as e:
            print("Error:", str(e))