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
from utils import set_seed
set_seed(42)


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
