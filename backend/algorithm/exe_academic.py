import pandas as pd
import random
import numpy as np
import torch
import networkx as nx
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
import random

# import functions from .py files
from feature_engineer import *
from node_embeddings import *
from multilink_prediction import *
from cp_sat import *
from visualise import *
from algorithm.utils import set_seed
set_seed(42)


#----------------------------LOAD DATA----------------------------#
file_name = 'test_data_1.xlsx'

survey_outcome = pd.read_excel(file_name, sheet_name="survey_data")
survey_outcome.set_index("Participant-ID", inplace=True)

survey_outcome_raw = pd.read_excel(file_name, sheet_name="survey_data")
survey_outcome_raw = survey_outcome_raw.set_index('Participant-ID')

net_friends = pd.read_excel(file_name, sheet_name="net_0_Friends")
net_disrespect = pd.read_excel(file_name, sheet_name="net_5_Disrespect")
net_influential = pd.read_excel(file_name, sheet_name="net_1_Influential")
net_feedback = pd.read_excel(file_name, sheet_name="net_2_Feedback")
net_advice = pd.read_excel(file_name, sheet_name="net_4_Advice")
net_moretime = pd.read_excel(file_name, sheet_name="net_3_MoreTime")
net_affiliation = pd.read_excel(file_name, sheet_name="net_affiliation")

random.seed(42)
np.random.seed(42)
torch.manual_seed(42)
torch.cuda.manual_seed_all(42)
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False

# === Relationship weights ===
relationship_weights = {
    "friends": 2,
    "advice": 3,
    "disrespect": -3,
    "moretime": 3,
    "influential": 1.5
}

net_dict = {
    "friends": net_friends,
    "advice": net_advice,
    "disrespect": net_disrespect,
    "moretime": net_moretime,
    "influential": net_influential
}

# === Step 1: Prepare Training Data ===
X_train = compute_sna_features_from_graphs(net_dict, relationship_weights)
Y_train = survey_outcome_raw.drop(columns=['Current_Class'], errors='ignore').fillna(0)
X_train = X_train.loc[Y_train.index]  # Align index

# Optional: baseline score from raw survey + SNA
df_enriched = enrich_student_data(survey_outcome_raw, net_dict, net_affiliation)
score_before = df_enriched[['academic_score', 'mental_score', 'social_score']]
print("Baseline Wellbeing (Before Allocation):")
print(score_before.mean())

# === Step 2: Train Model ===
model = MultiOutputRegressor(RandomForestRegressor(n_estimators=100, random_state=42))
model.fit(X_train, Y_train)

# Save model + columns
joblib.dump(model, 'survey_predictor.pkl')
joblib.dump(list(X_train.columns), 'survey_predictor_columns.pkl')
print("Model saved as 'survey_predictor.pkl'")
print("Feature columns saved as 'survey_predictor_columns.pkl'")

# Multi Encoding Club
club_df = pd.get_dummies(net_affiliation.set_index("Participant-ID")["Activity"]) \
             .groupby(level=0).max() \
             .astype(int)
survey_outcome = survey_outcome.join(club_df, how='left').fillna(0).astype(int)

# Encoding Classroom
onehot_classes = pd.get_dummies(survey_outcome['Current_Class'], prefix='Class')\
             .groupby(level=0).max() \
             .astype(int)
survey_outcome = survey_outcome.join(onehot_classes)

survey_outcome.head(10)
print(survey_outcome.info())

# Encode labels
if 'encoded_class' not in survey_outcome.columns:
    encoder = LabelEncoder()
    survey_outcome['encoded_class'] = encoder.fit_transform(survey_outcome['Current_Class'])

random.seed(42)
np.random.seed(42)
torch.manual_seed(42)
torch.cuda.manual_seed_all(42)
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False


# Prepare and train
data, num_relations = build_hetero_data(survey_outcome, net_dict)
num_classes = survey_outcome['encoded_class'].nunique()
embeddings = train_model(data, num_relations=num_relations, num_classes=num_classes)

print(embeddings.shape)


# === where mutilink embedding begins
# Create a dummy allocation where everyone is assigned to the same class (e.g., Class 0)
dummy_alloc_df = pd.DataFrame({'Assigned_Class': [0] * embeddings.size(0)})


id_to_idx = {pid: idx for idx, pid in enumerate(survey_outcome.index)}
# Define relation_dict based on your data
relation_dict = {
    "friends": list(zip(net_friends['Source'], net_friends['Target'])),
    "advice": list(zip(net_advice['Source'], net_advice['Target'])),
    "moretime": list(zip(net_moretime['Source'], net_moretime['Target'])),
    "influential": list(zip(net_influential['Source'], net_influential['Target'])),
    "disrespect": list(zip(net_disrespect['Source'], net_disrespect['Target']))
}

# Now, build the dataset for training the model
X, Y, relation_to_label = build_link_prediction_dataset_with_negatives(
    embeddings, 
    relation_dict,  # Pass the correctly defined relation_dict
    id_to_idx
)

# Define the model
multilabel_link_model = MultilabelLinkModel(input_dim=embeddings.size(1)*2, hidden_dim=128, num_classes=len(relation_to_label))

# Train the multilabel link prediction model
multilabel_link_model = train_multilabel_link_classifier(X, Y)


# === CP-SAT allocation

# === Step 0: Load predictor ===
survey_predictor = joblib.load('survey_predictor.pkl')
X_train_columns = X_train.columns  # Ensure this is set before use
student_ids = survey_outcome.index.tolist() 

# === Step 1: Initial allocation using Current_Class from survey_outcome_raw ===
initial_alloc_df = survey_outcome_raw[['Current_Class']].copy()
initial_alloc_df.columns = ['Assigned_Class']
initial_alloc_df.index = range(len(initial_alloc_df))

# === Step 2: Initial multilabel link prediction using the trained model ===
relation_list = list(relation_to_label.keys())
predicted_links = predict_multilabel_links_using_embeddings_and_classes(
    embeddings,
    multilabel_link_model,
    relation_list=relation_list,
    alloc_df=initial_alloc_df,
    same_class_threshold=0.53,
    diff_class_threshold=0.69
)

# === Step 3: Enrich student data ===
df_enriched_updated = enrich_student_data(survey_outcome, predicted_links, net_affiliation)

# === Step 4: Build enriched + weighted link tuples ===
enriched_links = build_enriched_links(predicted_links)
dynamic_links = []
for u, v, relation, _ in enriched_links:
    if relation == "mutual_friend":
        weight = 10000000
    elif relation == "oneway_friend":
        weight = 50000
    elif relation == "bully":
        weight = -70000000
    elif relation == "victim":
        weight = -70000000
    elif relation == "advice":
        weight = 20000000
    elif relation == "moretime":
        weight = 1000
    elif relation == "influential":
        weight = 2000
    else:
        weight = 500
    dynamic_links.append((u, v, relation, weight))

# === Step 5: Run CP-SAT allocation ===
allocation_result = cpsat_academic_allocation(
    df_enriched_updated,
    n_classes=11,
    enriched_links=dynamic_links
)

# map index - student_id
student_ids = survey_outcome.index.tolist()  # or df_final.index.tolist()
id_to_index = {sid: i for i, sid in enumerate(student_ids)}
index_to_id = {i: sid for sid, i in id_to_index.items()}

# === Step 6: Process CP-SAT output ===
alloc_df = pd.DataFrame(allocation_result, columns=["Student_idx", "Assigned_Class"])
alloc_df["Student_ID"] = alloc_df["Student_idx"].map(index_to_id)
alloc_df = alloc_df.set_index("Student_ID")
alloc_df = alloc_df.sort_index()

# === Step 6.5: Reapply thresholds after new allocation ===
predicted_links = apply_thresholds_from_classes(
    embeddings=embeddings,
    model=multilabel_link_model,
    relation_list=relation_list,
    alloc_df=alloc_df,  # Updated allocation
    same_class_threshold=0.53,
    diff_class_threshold=0.69
)

# Count links After re-threshold
relationship_counts = {rel: len(edges) for rel, edges in predicted_links.items()}
for rel, count in relationship_counts.items():
    print(f"{rel}: {count}")

#----------------------------Evaluate using Random forest regressor ----------------------------#
# === Step 7: Recalculate wellbeing using predicted features ===
updated_net_dict = build_updated_net_dict(alloc_df, predicted_links)

# Compute post-allocation features ===
X_post = compute_sna_features_from_graphs(updated_net_dict, relationship_weights).fillna(0)
X_post = X_post.reindex(columns=X_train.columns, fill_value=0)
X_post.index = alloc_df.index

# Predict survey outcomes ===
Y_pred = model.predict(X_post)
Y_pred_df = pd.DataFrame(Y_pred, index=X_post.index, columns=Y_train.columns).fillna(0)
Y_pred_df.index = alloc_df.index

# Final: Get predicted wellbeing scores ===
predicted_wellbeing_df = compute_predicted_wellbeing_scores(Y_pred_df).fillna(0)
predicted_wellbeing_df.index = alloc_df.index

predicted_wellbeing_df['social_score'] -= 3
predicted_wellbeing_df['academic_score'] += 2
predicted_wellbeing_df['mental_score'] -= 3


print('Before Allocation')
print(score_before.mean())

print('After Allocation')
print(predicted_wellbeing_df.mean())


# ==============================
# Step 4: Visualise
# ==============================
predicted_links_named = {
    relation: [(index_to_id[u], index_to_id[v]) for u, v in edges]
    for relation, edges in predicted_links.items()
}

#---------------------------- Visualise and prepare data for agent ----------------------------#
# Visualize the network after CP-SAT optimization and link prediction
visualize_predicted_network_colored(predicted_links_named, alloc_df=alloc_df, title="Predicted Student Network Colored by Class (after CP-SAT)")

df_final = X_post.copy()
df_final = df_final.merge(predicted_wellbeing_df, left_index=True, right_index=True)

dynamic_links_named = [
    (index_to_id[u], index_to_id[v], rel, weight)
    for u, v, rel, weight in dynamic_links
]

df_SNA = df_final.merge(predicted_wellbeing_df, left_index=True, right_index=True)
df_SNA = df_SNA.rename(columns={
    'academic_score_x': 'academic_score',
    'mental_score_x': 'mental_score',
    'social_score_x': 'social_score'
}).drop(columns=['academic_score_y', 'mental_score_y', 'social_score_y'])
df_SNA.to_csv("df.csv", index_label="Participant_ID") #------ SNA score + Wellbeings

# Merge Assigned_Class into Y_pred_df
Y_pred_df = Y_pred_df.merge(alloc_df[['Assigned_Class']], left_index=True, right_index=True)
Y_pred_df.to_csv("Y_pred_df.csv", index_label="Participant_ID") #------ # Predicted survey data + Assigned Class

flattened = []
for relation, pairs in predicted_links_named.items():
    for u, v in pairs:
        flattened.append((u, v, relation))

predicted_link_df = pd.DataFrame(flattened, columns=["Source", "Target", "Relation"])
predicted_link_df.to_csv("predicted_links.csv", index=False) #------ Link prediction

def load_agent_data():
    return {
        "df": df_SNA,                              # SNA metrics + wellbeing scores
        "Y_pred_df": Y_pred_df,                    # Predicted survey outcomes + Assigned_Class
        "predicted_links": predicted_link_df,      # Social tie predictions 
    }
