import networkx as nx
import seaborn as sns
import matplotlib.pyplot as plt
from utils import set_seed
set_seed(42)

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
        "disrespect": "red",
        "feedback" : "yellow"
    }

    for relation, color in relation_colors.items():
        relation_edges = [(u, v) for u, v, d in G.edges(data=True) if d.get('relation') == relation]
        nx.draw_networkx_edges(G, pos, edgelist=relation_edges, edge_color=color, width=2, alpha=0.7)

    nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=100, alpha=0.9)

    plt.title(title, fontsize=18)
    plt.axis('off')
    plt.show()
