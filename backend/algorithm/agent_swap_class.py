import pandas as pd
import joblib
from cp_sat import apply_thresholds_from_classes
from feature_engineer import (build_updated_net_dict,
                              compute_sna_features_from_graphs,
                              compute_predicted_wellbeing_scores)

from utils import set_seed
set_seed(42)

# === Load Required Files ===
survey_outcome = pd.read_csv("df.csv", index_col="Participant_ID")
predicted_link_df = pd.read_csv("predicted_links.csv")
Y_pred_df = pd.read_csv("Y_pred_df.csv", index_col="Participant_ID")

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


# --- GLOBAL HOLDER FOR FINAL RESULT ---
last_result = {}

def reallocate_student_to_class(student_id: int, new_class: int):
    global last_result

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
