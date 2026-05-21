SELECT ds.skill_label AS competence, ds.skill_category AS categorie, ds.usage_count AS occurrences
FROM dim_skill ds
ORDER BY ds.usage_count DESC
LIMIT 15;
