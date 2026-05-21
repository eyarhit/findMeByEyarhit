SELECT fc.statut_candidature AS statut, SUM(fc.candidature_count) AS nombre_candidatures
FROM fact_candidature fc
GROUP BY fc.statut_candidature
ORDER BY nombre_candidatures DESC;
