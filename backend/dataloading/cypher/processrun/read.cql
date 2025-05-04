MATCH (pr:ProcessRun)
RETURN 
    pr.ID AS ID,
    pr.name AS name,
    pr.run_type AS run_type,
    pr.description AS description,
    pr.start_date AS start_date,
    pr.end_date AS end_date,
    pr.created_at AS created_at,
    pr.updated_at AS updated_at
ORDER BY pr.ID
