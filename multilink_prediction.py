#----------------------------Relationship prediction (Multilabel link model, Binary Cross-entrophy loss fn----------------------------#
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from sklearn.model_selection import train_test_split
import random
import numpy as np


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
