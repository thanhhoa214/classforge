MERGE (pr:ProcessRun {
    id: $id,
    name: $name,
    run_type: $run_type,
    description: $description,
    status: $status,
    start_date: $start_date,
    created_at: $created_at,
    updated_at: $updated_at
})
ON CREATE SET pr.created_at = $created_at

return pr