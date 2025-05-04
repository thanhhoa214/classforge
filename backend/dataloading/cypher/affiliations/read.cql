MATCH (a:Affiliation)
RETURN 
    a.id AS `ID`,
    a.title AS `Title`,
    a.category AS `Category`,
    a.description AS `Description`
