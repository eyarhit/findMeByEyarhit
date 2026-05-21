-- mission_bd — part des candidatures par statut (conversion RH)
SELECT
  COALESCE(c.statut_candidature, 'INCONNU') AS statut,
  COUNT(*) AS nombre,
  ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM candidature), 0), 1) AS pourcentage
FROM candidature c
GROUP BY COALESCE(c.statut_candidature, 'INCONNU')
ORDER BY nombre DESC;
