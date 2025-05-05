import pandas as pd
import random
import numpy as np
import torch
import networkx as nx
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
from utils import set_seed
set_seed(42)


TARGET_MAX_SCORE = 100
# === Relationship weights ===
relationship_weights = {
    "friends": 2,
    "advice": 3,
    "disrespect": -3,
    "moretime": 3,
    "influential": 1.5
}

# === Feature Engineering ===
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
