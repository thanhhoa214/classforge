MERGE (g:Group {
    name: $name
    , metric: $metric
    , description: $description
})
RETURN g