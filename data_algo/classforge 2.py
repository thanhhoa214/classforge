import pandas as pd
import random
import numpy as np
import torch

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

from sklearn.preprocessing import MinMaxScaler, LabelEncoder

net_dict = {
    "friends": net_friends,
    "advice": net_advice,
    "disrespect": net_disrespect,
    "moretime": net_moretime,
    "influential": net_influential
}

#----------------------------DEFINE, FEATURE ENGINEERING----------------------------#
TARGET_MAX_SCORE = 100

def enrich_student_data(survey_df, net_dict, net_affiliation):
    df = survey_df.copy()

    # 1. Add SNA metrics from social networks
    for relation, edge_df in net_dict.items():
        if isinstance(edge_df, list):
            G = nx.DiGraph()
            G.add_edges_from(edge_df)
        else:
            G = nx.from_pandas_edgelist(edge_df, source='Source', target='Target', create_using=nx.DiGraph())

        sna_temp = pd.DataFrame(index=G.nodes())
        sna_temp[f'{relation}_in_deg'] = pd.Series(dict(G.in_degree()))
        sna_temp[f'{relation}_close'] = pd.Series(nx.closeness_centrality(G))
        sna_temp[f'{relation}_between'] = pd.Series(nx.betweenness_centrality(G))

        df = df.merge(sna_temp, left_index=True, right_index=True, how='left')

    df.fillna(0, inplace=True)

    # 2. Normalise all SNA features
    sna_cols = [col for col in df.columns if any(metric in col for metric in ['_in_deg', '_close', '_between'])]
    df[sna_cols] = MinMaxScaler().fit_transform(df[sna_cols])

    # 3. Intermediate Wellbeing Calculations
    if all(col in df.columns for col in ['Manbox5_1', 'Manbox5_2', 'Manbox5_3', 'Manbox5_4', 'Manbox5_5']):
        df['Manbox5_overall'] = df[['Manbox5_1', 'Manbox5_2', 'Manbox5_3', 'Manbox5_4', 'Manbox5_5']].mean(axis=1)

    if all(col in df.columns for col in ['Nervous', 'Hopeless', 'Restless', 'Depressed', 'Tried', 'Worthless']):
        df['Q9_avg'] = df[['Nervous', 'Hopeless', 'Restless', 'Depressed', 'Tried', 'Worthless']].mean(axis=1)

    if all(col in df.columns for col in ['Intelligence1', 'Intelligence2']):
        df['intelligence_avg'] = df[['Intelligence1', 'Intelligence2']].mean(axis=1)

    # 4. Reverse Scoring for Negative Variables
    neg_vars = ['Q9_avg', 'Manbox5_overall', 'intelligence_avg', 'COVID',
                'disrespect_in_deg', 'isolated', 'opinion', 'Soft', 'criticises',
                'WomenDifferent', 'Nerds', 'MenBetterSTEM', 'disrespect_between']

    for var in neg_vars:
        if var in df.columns:
            if var == 'Q9_avg':
                df[f'{var}_rev'] = 6 - df[var]
            else:
                df[f'{var}_rev'] = 8 - df[var]

    # 5. Helper Functions for Score Computation
    def scale_columns_individually(df, cols, target_max=TARGET_MAX_SCORE):
        scaled_cols = []
        for col in cols:
            if col in df.columns:
                scaled_col = col + '_scaled'
                df[scaled_col] = df[col] / df[col].max() * target_max
                scaled_cols.append(scaled_col)
        return scaled_cols

    def compute_academic_score(df):
        academic_cols = ['Perc_Effort', 'Perc_Academic', 'Attendance', 'future',
                         'advice_in_deg', 'advice_between']
        scaled_cols = scale_columns_individually(df, academic_cols, target_max=TARGET_MAX_SCORE)
        df['academic_score'] = df[scaled_cols].mean(axis=1)
        return df

    def compute_mental_score(df):
        mental_cols = ['pwi_wellbeing', 'Q9_avg_rev', 'Manbox5_overall_rev',
                       'intelligence_avg_rev', 'COVID_rev', 'disrespect_in_deg_rev']
        scaled_cols = scale_columns_individually(df, mental_cols, target_max=TARGET_MAX_SCORE)
        df['mental_score'] = df[scaled_cols].mean(axis=1)
        return df

    def compute_social_score(df):
        social_cols = ['comfortable', 'bullying', 'friends_between', 'friends_in_deg', 'friends_close',
                       'criticises_rev', 'isolated_rev', 'opinion_rev', 'Soft_rev',
                       'WomenDifferent_rev', 'Nerds_rev', 'MenBetterSTEM_rev', 'disrespect_between_rev']
        scaled_cols = scale_columns_individually(df, social_cols, target_max=TARGET_MAX_SCORE)
        df['social_score'] = df[scaled_cols].mean(axis=1)
        return df

    # 6. Apply wellbeing scoring
    df = compute_academic_score(df)
    df = compute_mental_score(df)
    df = compute_social_score(df)

    return df

def build_updated_net_dict(alloc_df, predicted_links_dict):
    """
    Build updated network dictionaries, keeping only links where both students are assigned to the same class.
    Returns a dictionary of DataFrames {relation: DataFrame(Source, Target)}.
    """
    student_to_class = dict(zip(alloc_df.index, alloc_df['Assigned_Class']))
    updated_net_dict = {rel: [] for rel in predicted_links_dict.keys()}

    for rel, links in predicted_links_dict.items():
        for u, v in links:
            if student_to_class.get(u) == student_to_class.get(v):
                updated_net_dict[rel].append((u, v))
    
    # Convert list of (u,v) into DataFrame per relation
    updated_net_dict_df = {}
    for rel, edges in updated_net_dict.items():
        updated_net_dict_df[rel] = pd.DataFrame(edges, columns=["Source", "Target"])
    
    return updated_net_dict_df

import pandas as pd
import numpy as np
import networkx as nx
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor

# Set reproducible seed
np.random.seed(42)

# === Relationship weights ===
relationship_weights = {
    "friends": 2,
    "advice": 3,
    "disrespect": -3,
    "moretime": 3,
    "influential": 1.5
}

# === SNA feature extractor ===
def compute_sna_features_from_graphs(net_dict, relationship_weights):
    feature_list = []
    for relation, edge_df in net_dict.items():
        G = nx.from_pandas_edgelist(edge_df, source='Source', target='Target', create_using=nx.DiGraph())
        weight = relationship_weights.get(relation, 1)
        for u, v in G.edges():
            G[u][v]['weight'] = weight
        df_temp = pd.DataFrame({
            f'{relation}_in_degree': pd.Series(dict(G.in_degree())),
            f'{relation}_out_degree': pd.Series(dict(G.out_degree())),
            f'{relation}_closeness': pd.Series(nx.closeness_centrality(G)),
            f'{relation}_betweenness': pd.Series(nx.betweenness_centrality(G)),
        })
        feature_list.append(df_temp)
    return pd.concat(feature_list, axis=1).groupby(level=0).first().fillna(0)

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

# === Step 3: Define wellbeing scoring ===
def compute_predicted_wellbeing_scores(df):
    df = df.copy()
    df['Manbox5_overall'] = df[[f'Manbox5_{i}' for i in range(1, 6)]].mean(axis=1)
    df['Q9_avg'] = df[['Nervous', 'Hopeless', 'Restless', 'Depressed', 'Tried', 'Worthless']].mean(axis=1)
    df['intelligence_avg'] = df[['Intelligence1', 'Intelligence2']].mean(axis=1)

    reverse_cols = ['Q9_avg', 'Manbox5_overall', 'intelligence_avg', 'COVID',
                    'disrespect_in_deg', 'isolated', 'opinion', 'Soft', 'criticises',
                    'WomenDifferent', 'Nerds', 'MenBetterSTEM', 'disrespect_between']
    for col in reverse_cols:
        if col in df.columns:
            df[f'{col}_rev'] = 6 - df[col] if col == 'Q9_avg' else 8 - df[col]

    def scale_cols(df, cols, max_score=100):
        scaled = []
        for col in cols:
            if col in df.columns:
                new_col = f'{col}_scaled'
                df[new_col] = df[col] / df[col].max() * max_score
                scaled.append(new_col)
        return scaled

    df['academic_score'] = df[scale_cols(df, ['Perc_Effort', 'Perc_Academic', 'Attendance', 'future',
                                              'advice_in_deg', 'advice_between'])].mean(axis=1)
    df['mental_score'] = df[scale_cols(df, ['pwi_wellbeing', 'Q9_avg_rev', 'Manbox5_overall_rev',
                                            'intelligence_avg_rev', 'COVID_rev', 'disrespect_in_deg_rev'])].mean(axis=1)
    df['social_score'] = df[scale_cols(df, ['comfortable', 'bullying', 'friends_between', 'friends_in_deg', 'friends_close',
                                            'criticises_rev', 'isolated_rev', 'opinion_rev', 'Soft_rev',
                                            'WomenDifferent_rev', 'Nerds_rev', 'MenBetterSTEM_rev', 'disrespect_between_rev'])].mean(axis=1)
    return df[['academic_score', 'mental_score', 'social_score']]



# Preprocessing

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


#----------------------------Node Embedding (RCG, 32D)----------------------------#
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.data import HeteroData
from torch_geometric.nn import RGCNConv
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
from sklearn.manifold import TSNE
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import random

# --- Set Random Seeds for Reproducibility ---
random.seed(42)
np.random.seed(42)
torch.manual_seed(42)
torch.cuda.manual_seed_all(42)
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False

# --- Build HeteroData object ---
def build_hetero_data(survey_df, net_dict):
    data = HeteroData()
    id_to_idx = {pid: idx for idx, pid in enumerate(survey_df.index)}
    
    # --- Node features ---
    exclude_cols = ['encoded_class', 'Current_Class']
    scale_cols = survey_df.select_dtypes(include='number').drop(columns=exclude_cols, errors='ignore').columns
    scaler = MinMaxScaler()
    survey_df[scale_cols] = scaler.fit_transform(survey_df[scale_cols].fillna(0))
    node_features = torch.tensor(survey_df[scale_cols].values, dtype=torch.float)
    data['student'].x = node_features

    # --- Edges ---
    edge_index_all = []
    edge_type_all = []
    relation_types = list(net_dict.keys())

    for rel_id, (rel, df) in enumerate(net_dict.items()):
        edges = [(id_to_idx[src], id_to_idx[tgt]) for src, tgt in zip(df['Source'], df['Target'])
                 if src in id_to_idx and tgt in id_to_idx]
        if edges:
            e_idx = torch.tensor(edges, dtype=torch.long).t().contiguous()
            edge_index_all.append(e_idx)
            edge_type_all.append(torch.full((e_idx.size(1),), rel_id, dtype=torch.long))

    # Concatenate all edges and types
    data['student'].edge_index = torch.cat(edge_index_all, dim=1)
    data['student'].edge_type = torch.cat(edge_type_all)

    # Add labels for supervised learning
    data['student'].y = torch.tensor(survey_df['encoded_class'].values, dtype=torch.long)

    return data, len(relation_types)

# --- Define RGCN Model ---
class RGCN(nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels, num_relations, num_classes):
        super().__init__()
        self.conv1 = RGCNConv(in_channels, hidden_channels, num_relations)
        self.conv2 = RGCNConv(hidden_channels, out_channels, num_relations)
        self.classifier = nn.Linear(out_channels, num_classes)  # Output dimension based on node features

    def forward(self, x, edge_index, edge_type):
        x = self.conv1(x, edge_index, edge_type)
        x = F.relu(x)
        x = self.conv2(x, edge_index, edge_type)
        logits = self.classifier(x)  # No need to flatten, output is directly suitable for classification
        return x, logits

# --- Train RGCN ---
def train_model(data, num_relations, num_classes, hidden_dim=64, out_dim=32, epochs=100, lr=0.01):
    model = RGCN(data['student'].x.size(1), hidden_dim, out_dim, num_relations, num_classes)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss()

    x = data['student'].x
    edge_index = data['student'].edge_index
    edge_type = data['student'].edge_type
    y = data['student'].y

    model.train()
    for epoch in range(epochs):
        optimizer.zero_grad()
        embeddings, logits = model(x, edge_index, edge_type)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()
        if epoch % 20 == 0:
            print(f"Epoch {epoch} | Loss: {loss.item():.4f}")

    model.eval()
    with torch.no_grad():
        embeddings, _ = model(x, edge_index, edge_type)
        return embeddings

# --- Visualise Embeddings ---
def visualise_embeddings(embeddings, labels=None, title='R-GCN Node Embeddings (t-SNE)'):
    tsne = TSNE(n_components=2, perplexity=20, random_state=42)
    reduced = tsne.fit_transform(embeddings)
    plt.figure(figsize=(8, 6))
    scatter = plt.scatter(reduced[:, 0], reduced[:, 1], c=labels, cmap='tab10', s=40, alpha=0.8)
    if labels is not None:
        plt.legend(*scatter.legend_elements(), title="Class")
    plt.title(title)
    plt.xlabel("t-SNE 1")
    plt.ylabel("t-SNE 2")
    plt.grid(True)
    plt.show()

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

# dictionary of social graphs
net_dict = {
    "friends": net_friends,
    "advice": net_advice,
    "disrespect": net_disrespect,
    "moretime": net_moretime,
    "influential": net_influential
}

# Prepare and train
data, num_relations = build_hetero_data(survey_outcome, net_dict)
num_classes = survey_outcome['encoded_class'].nunique()
embeddings = train_model(data, num_relations=num_relations, num_classes=num_classes)

print(embeddings.shape)

# Visualise
#visualise_embeddings(embeddings.numpy(), labels=survey_outcome['encoded_class'].values)

random.seed(42)
np.random.seed(42)
torch.manual_seed(42)
torch.cuda.manual_seed_all(42)
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False


#----------------------------Relationship prediction (Multilabel link model, Binary Cross-entrophy loss fn----------------------------#
import torch
import torch.nn as nn
import torch.nn.functional as F

class MultilabelLinkModel(nn.Module):
    def __init__(self, input_dim, hidden_dim, num_classes, dropout=0.1):
        super(MultilabelLinkModel, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.bn1 = nn.BatchNorm1d(hidden_dim)
        
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.bn2 = nn.BatchNorm1d(hidden_dim)
        
        self.out = nn.Linear(hidden_dim, num_classes)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        x = self.fc1(x)
        x = self.bn1(x)
        x = F.relu(x)
        x = self.dropout(x)

        x = self.fc2(x)
        x = self.bn2(x)
        x = F.relu(x)
        x = self.dropout(x)

        return self.out(x)  # No softmax here
    
import torch.optim as optim
from sklearn.model_selection import train_test_split

def train_multilabel_link_predictor(X, Y, hidden_dim=128, epochs=100, lr=0.0001):
    input_dim = X.size(1)
    num_classes = Y.size(1)

    model = MultilabelLinkModel(input_dim, hidden_dim, num_classes)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.BCEWithLogitsLoss()

    X_train, X_val, Y_train, Y_val = train_test_split(X, Y, test_size=0.3, random_state=42)

    model.train()
    for epoch in range(epochs):
        optimizer.zero_grad()
        logits = model(X_train)
        loss = criterion(logits, Y_train)
        loss.backward()
        optimizer.step()

        if epoch % 10 == 0 or epoch == epochs - 1:
            model.eval()
            with torch.no_grad():
                val_logits = model(X_val)
                val_loss = criterion(val_logits, Y_val)
            print(f"Epoch {epoch} | Train Loss: {loss.item():.4f} | Val Loss: {val_loss.item():.4f}")
            model.train()

    return model


def predict_multilabel_links_using_embeddings_and_classes(
    embeddings, model, relation_list, 
    alloc_df, 
    same_class_threshold=0.5, 
    diff_class_threshold=0.9
):
    """
    Predict multilabel links with additional constraints.
    - Friends and Disrespect cannot coexist.
    - Disrespect can only be predicted with Influential.
    """
    model.eval()
    predicted_links = {rel: [] for rel in relation_list}

    with torch.no_grad():
        n = embeddings.size(0)
        for u in range(n):
            for v in range(n):
                if u == v:
                    continue  # Skip self-loops
                feature = torch.cat([embeddings[u], embeddings[v]]).unsqueeze(0)  # Concatenate embeddings
                logits = model(feature)  # Model output (logits)
                probs = torch.sigmoid(logits).squeeze(0)  # Apply sigmoid to get probabilities

                same_class = alloc_df.loc[u]['Assigned_Class'] == alloc_df.loc[v]['Assigned_Class']

                # Apply thresholds based on class relation
                threshold = same_class_threshold if same_class else diff_class_threshold

                # Apply the constraints for each pair of students (u, v)
                valid_prediction = True

                # Constraint 1: Friends and Disrespect cannot both be predicted at the same time
                if probs[relation_list.index("friends")].item() >= threshold and probs[relation_list.index("disrespect")].item() >= threshold:
                    valid_prediction = False

                # Constraint 2: Disrespect can only be predicted if Influential is also predicted
                if probs[relation_list.index("disrespect")].item() >= threshold and probs[relation_list.index("influential")].item() < threshold:
                    valid_prediction = False

                # If no constraints are violated, add the link prediction
                if valid_prediction:
                    for idx, prob in enumerate(probs):
                        if prob.item() >= threshold:
                            predicted_links[relation_list[idx]].append((u, v))

    return predicted_links

def train_multilabel_link_classifier(X, Y, hidden_dim=128, epochs=400, lr=0.00001, relation_to_label=None):
    input_dim = X.size(1)
    num_classes = Y.size(1)

    model = MultilabelLinkModel(input_dim, hidden_dim, num_classes)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.BCEWithLogitsLoss(reduction='none')  # No reduction for custom weighting

    X_train, X_val, Y_train, Y_val = train_test_split(X, Y, test_size=0.3, random_state=42)

    # --- Boosting Weights ---
    weight_multiplier = torch.ones(num_classes)

    if relation_to_label is not None:
        for relation, idx in relation_to_label.items():
            if relation == "friends":
                weight_multiplier[idx] = 1
            elif relation == "advice":
                weight_multiplier[idx] = 1
            elif relation == "moretime":
                weight_multiplier[idx] = 1
            elif relation == "influential":
                weight_multiplier[idx] = 1
            elif relation == "disrespect":
                weight_multiplier[idx] = -5

    model.train()
    for epoch in range(epochs):
        optimizer.zero_grad()
        preds = model(X_train)
        loss_matrix = criterion(preds, Y_train)

        # ✨ Apply boosting per tie type
        loss_matrix = loss_matrix * weight_multiplier

        loss = loss_matrix.mean()
        loss.backward()
        optimizer.step()

        if epoch % 10 == 0 or epoch == epochs - 1:
            model.eval()
            with torch.no_grad():
                val_preds = model(X_val)
                val_loss_matrix = criterion(val_preds, Y_val)
                val_loss_matrix = val_loss_matrix * weight_multiplier
                val_loss = val_loss_matrix.mean()
            print(f"Epoch {epoch} | Train Loss: {loss.item():.4f} | Val Loss: {val_loss.item():.4f}")
            model.train()

    return model

def build_link_prediction_dataset_with_negatives(
    embeddings, 
    relation_dict, 
    id_to_idx, 
    num_negatives_per_positive=1,
    seed=42
):
    # Ensure reproducibility
    random.seed(seed)
    torch.manual_seed(seed)
    np.random.seed(seed)

    X, y = [], []
    relation_to_label = {rel: idx for idx, rel in enumerate(relation_dict.keys())}
    num_classes = len(relation_to_label)
    n = embeddings.size(0)

    # Positive samples
    seen_pairs = set()
    for relation, edges in relation_dict.items():
        label_idx = relation_to_label[relation]
        for u, v in edges:
            if u in id_to_idx and v in id_to_idx:
                u_idx = id_to_idx[u]
                v_idx = id_to_idx[v]
                feature = torch.cat([embeddings[u_idx], embeddings[v_idx]])
                
                # Create a label vector where only the corresponding relation index is 1
                label_vec = torch.zeros(num_classes)
                label_vec[label_idx] = 1.0
                X.append(feature)
                y.append(label_vec)  # Add tensor instead of integer
                seen_pairs.add((u_idx, v_idx))

    n_positives = len(X)

    # Negative samples - deterministic sampling (no randomness)
    all_student_indices = list(range(n))
    num_negatives = n_positives * num_negatives_per_positive

    # Use round-robin to pair students deterministically
    for i in range(num_negatives):
        u = all_student_indices[i % len(all_student_indices)]
        v = all_student_indices[(i + 1) % len(all_student_indices)]  # Ensure distinct pairs
        if u != v and (u, v) not in seen_pairs:
            feature = torch.cat([embeddings[u], embeddings[v]])
            
            # Negative sample has all labels as 0
            label_vec = torch.zeros(num_classes)
            X.append(feature)
            y.append(label_vec)  # Add tensor instead of integer
            seen_pairs.add((u, v))

    X = torch.stack(X)  # Stack features
    y = torch.stack(y)  # Stack labels as tensors
    return X, y, relation_to_label

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


#----------------------------Re-apply threshold, CP-SAT (with enrich link)----------------------------#
import pandas as pd
import numpy as np
import torch
from ortools.sat.python import cp_model

# ==============================
# Step 1: Build enriched links
# ==============================
def build_enriched_links(predicted_links_dict):
    enriched_links = []

    friends_set = set(predicted_links_dict.get("friends", []))
    for u, v in friends_set:
        if (v, u) in friends_set:
            enriched_links.append((u, v, "mutual_friend", 10))
        else:
            enriched_links.append((u, v, "oneway_friend", 1))

    for u, v in predicted_links_dict.get("advice", []):
        enriched_links.append((u, v, "advice", 10))

    for u, v in predicted_links_dict.get("moretime", []):
        enriched_links.append((u, v, "moretime", 1))

    for u, v in predicted_links_dict.get("influential", []):
        enriched_links.append((u, v, "influential", 10))

    for u, v in predicted_links_dict.get("disrespect", []):
        enriched_links.append((u, v, "bully", -10))
        enriched_links.append((v, u, "victim", 1))

    return enriched_links

# ==============================
# Step 2: Re-threshold links
# ==============================
def apply_thresholds_from_classes(embeddings, model, relation_list, alloc_df, same_class_threshold=0.5, diff_class_threshold=0.7):
    model.eval()
    predicted_links = {rel: [] for rel in relation_list}

    with torch.no_grad():
        n = embeddings.size(0)
        for u in range(n):
            for v in range(n):
                if u == v:
                    continue
                feature = torch.cat([embeddings[u], embeddings[v]]).unsqueeze(0)
                logits = model(feature)
                probs = torch.sigmoid(logits).squeeze(0)

                same_class = alloc_df.iloc[u]['Assigned_Class'] == alloc_df.iloc[v]['Assigned_Class']
                threshold = same_class_threshold if same_class else diff_class_threshold

                valid = True
                if probs[relation_list.index("friends")].item() >= threshold and probs[relation_list.index("disrespect")].item() >= threshold:
                    valid = False
                if probs[relation_list.index("disrespect")].item() >= threshold and probs[relation_list.index("influential")].item() < threshold:
                    valid = False

                if valid:
                    for idx, prob in enumerate(probs):
                        if prob.item() >= threshold:
                            predicted_links[relation_list[idx]].append((u, v))
    return predicted_links

# ==============================
# Step 3: CP-SAT allocation
# ==============================
def cpsat_wellbeing_and_ties_allocation(df, n_classes, enriched_links, wellbeing_weight=1, tolerance=0.1):
    model = cp_model.CpModel()
    n_students = len(df)
    students = range(n_students)
    classes = range(n_classes)

    assign = {}
    for s in students:
        for c in classes:
            assign[(s, c)] = model.NewBoolVar(f'student_{s}_class_{c}')

    for s in students:
        model.AddExactlyOne(assign[(s, c)] for c in classes)

    base_size = n_students // n_classes
    min_size = int(base_size * (1 - tolerance))
    max_size = int(base_size * (1 + tolerance))
    for c in classes:
        model.Add(sum(assign[(s, c)] for s in students) >= min_size)
        model.Add(sum(assign[(s, c)] for s in students) <= max_size)

    objective_terms = []

    for s in students:
        wellbeing_score = (
            df.iloc[s]['academic_score'] +
            df.iloc[s]['mental_score'] +
            df.iloc[s]['social_score']
        )
        for c in classes:
            objective_terms.append(assign[(s, c)] * int(wellbeing_score * wellbeing_weight * 100))

    for u, v, relation, weight in enriched_links:
        for c in classes:
            same_class = model.NewBoolVar(f'same_class_{relation}_{u}_{v}_{c}')
            model.AddMultiplicationEquality(same_class, [assign[(u, c)], assign[(v, c)]])
            objective_terms.append(weight * same_class)

    model.Maximize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 20
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    allocation = []

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for s in students:
            for c in classes:
                if solver.BooleanValue(assign[(s, c)]):
                    allocation.append((s, c))
    else:
        return None

    return allocation

# Set reproducible seed
np.random.seed(42)

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
allocation_result = cpsat_wellbeing_and_ties_allocation(
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

print('Before Allocation')
print(score_before.mean())

print('After Allocation')
print(predicted_wellbeing_df.mean())

import seaborn as sns

# ==============================
# Step 4: Visualise
# ==============================
predicted_links_named = {
    relation: [(index_to_id[u], index_to_id[v]) for u, v in edges]
    for relation, edges in predicted_links.items()
}

def visualize_predicted_network_colored(predicted_links, alloc_df, title="Predicted Student Network Colored by Class"):
    G = nx.Graph()
    
    

    # Add edges
    for relation, edges in predicted_links.items():
        for u, v in edges:
            G.add_edge(u, v, relation=relation)

    # Add node attributes
    class_colors = {}
    classes = alloc_df['Assigned_Class'].unique()
    palette = sns.color_palette("hsv", len(classes))
    for idx, c in enumerate(sorted(classes)):
        class_colors[c] = palette[idx]

    node_colors = []
    for node in G.nodes():
        if node in alloc_df.index:
            node_class = alloc_df.loc[node, 'Assigned_Class']
            color = class_colors.get(node_class, (0.5, 0.5, 0.5))  # default grey
        else:
            color = (0.5, 0.5, 0.5)
        node_colors.append(color)

    # Ensure reproducible layout by setting the seed
    pos = nx.spring_layout(G, seed=42)

    # Draw
    plt.figure(figsize=(14, 12))

    # Draw edges by type
    relation_colors = {
        "friends": "green",
        "advice": "blue",
        "moretime": "purple",
        "influential": "orange",
        "disrespect": "red"
    }

    for relation, color in relation_colors.items():
        relation_edges = [(u, v) for u, v, d in G.edges(data=True) if d.get('relation') == relation]
        nx.draw_networkx_edges(G, pos, edgelist=relation_edges, edge_color=color, width=2, alpha=0.7)

    nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=100, alpha=0.9)

    plt.title(title, fontsize=18)
    plt.axis('off')
    plt.show()
    
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