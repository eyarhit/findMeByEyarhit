SELECT
  fc.statut_candidature AS statut,
  SUM(fc.candidature_count) AS nombre,
  ROUND(100.0 * SUM(fc.candidature_count) / NULLIF((SELECT SUM(candidature_count) FROM fact_candidature), 0), 1) AS pourcentage
FROM fact_candidature fc
GROUP BY fc.statut_candidature
ORDER BY nombre DESC;
