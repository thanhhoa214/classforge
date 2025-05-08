#----------------------------Re-apply threshold, CP-SAT (with enrich link)----------------------------#
import pandas as pd
import numpy as np
import torch
from ortools.sat.python import cp_model
from algorithm.utils import set_seed
set_seed(42)

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
        
    for u, v in predicted_links_dict.get("feedback", []):
        enriched_links.append((u, v, "feedback", 10))

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
    solver.parameters.random_seed = 42
    solver.parameters.linearization_level = 0
    solver.parameters.max_time_in_seconds = 20 # --need tune
    solver.parameters.num_search_workers = 8
    solver.parameters.num_search_workers = 1
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


# maximise social score
def cpsat_social_allocation(df, n_classes, enriched_links, wellbeing_weight=1, dominance_factor=1000, penalty_factor=100, tolerance=0.1, social_boost_factor=2.0):
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
        for c in classes:
            # Student scores
            social_score = df.iloc[s]['social_score']
            academic_score = df.iloc[s]['academic_score']
            mental_score = df.iloc[s]['mental_score']

            # --- Step 1: SOCIAL weight - dominant ---
            social_weight = wellbeing_weight * dominance_factor * 1000  # Base dominance
            if social_score < 70:
                social_weight *= social_boost_factor  # Amplify further if needed

            # --- Step 2: Academic & Mental - minor penalties ---
            # Lower weight if scores are high, to reduce their influence
            academic_weight = 0.005 * penalty_factor
            mental_weight = 0.005 * penalty_factor
            if academic_score > 80:
                academic_weight *= 0.01
            if mental_score > 80:
                mental_weight *= 0.01

            # --- Step 3: Objective Terms ---
            objective_terms.append(assign[(s, c)] * int(social_score * social_weight))
            objective_terms.append(-assign[(s, c)] * int(academic_score * academic_weight))
            objective_terms.append(-assign[(s, c)] * int(mental_score * mental_weight))

    for u, v, relation, weight in enriched_links:
        for c in classes:
            same_class = model.NewBoolVar(f'same_class_{relation}_{u}_{v}_{c}')
            model.AddMultiplicationEquality(same_class, [assign[(u, c)], assign[(v, c)]])
            objective_terms.append(weight * same_class)

    model.Maximize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 40
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

# maximise academic score
def cpsat_academic_allocation(df, n_classes, enriched_links, wellbeing_weight=1, dominance_factor=1000, penalty_factor=100, tolerance=0.1, social_boost_factor=2.0):
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
        for c in classes:
            # Student scores
            social_score = df.iloc[s]['social_score']
            academic_score = df.iloc[s]['academic_score']
            mental_score = df.iloc[s]['mental_score']

            academic_weight = wellbeing_weight * dominance_factor * 1000  # Base dominance
            if academic_score < 70:
                academic_weight *= social_boost_factor  # Amplify further if needed

            # Lower weight if scores are high, to reduce their influence
            social_weight = 0.005 * penalty_factor
            mental_weight = 0.005 * penalty_factor
            if social_score > 80:
                social_weight *= 0.01
            if mental_score > 80:
                mental_weight *= 0.01

            # --- Step 3: Objective Terms ---
            objective_terms.append(-assign[(s, c)] * int(social_score * social_weight))
            objective_terms.append(assign[(s, c)] * int(academic_score * academic_weight))
            objective_terms.append(-assign[(s, c)] * int(mental_score * mental_weight))

    for u, v, relation, weight in enriched_links:
        for c in classes:
            same_class = model.NewBoolVar(f'same_class_{relation}_{u}_{v}_{c}')
            model.AddMultiplicationEquality(same_class, [assign[(u, c)], assign[(v, c)]])
            objective_terms.append(weight * same_class)

    model.Maximize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 40
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

# max mental score
def cpsat_mental_allocation(df, n_classes, enriched_links, wellbeing_weight=1, dominance_factor=1000, penalty_factor=100, tolerance=0.1, social_boost_factor=2.0):
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
        for c in classes:
            # Student scores
            social_score = df.iloc[s]['social_score']
            academic_score = df.iloc[s]['academic_score']
            mental_score = df.iloc[s]['mental_score']

            mental_weight = wellbeing_weight * dominance_factor * 1000  # Base dominance
            if mental_score < 70:
                mental_weight *= social_boost_factor  # Amplify further if needed

            # Lower weight if scores are high, to reduce their influence
            social_weight = 0.005 * penalty_factor
            academic_weight = 0.005 * penalty_factor
            if social_score > 80:
                social_weight *= 0.01
            if academic_score > 80:
                academic_weight *= 0.01

            # --- Step 3: Objective Terms ---
            objective_terms.append(-assign[(s, c)] * int(social_score * social_weight))
            objective_terms.append(-assign[(s, c)] * int(academic_score * academic_weight))
            objective_terms.append(assign[(s, c)] * int(mental_score * mental_weight))

    for u, v, relation, weight in enriched_links:
        for c in classes:
            same_class = model.NewBoolVar(f'same_class_{relation}_{u}_{v}_{c}')
            model.AddMultiplicationEquality(same_class, [assign[(u, c)], assign[(v, c)]])
            objective_terms.append(weight * same_class)

    model.Maximize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 40
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
