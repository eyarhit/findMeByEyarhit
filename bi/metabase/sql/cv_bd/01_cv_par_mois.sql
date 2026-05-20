-- Connexion Metabase : cv_bd
SELECT
  DATE_FORMAT(c.created_at, '%Y-%m') AS mois,
  COUNT(*) AS cv_crees
FROM cv c
WHERE c.created_at IS NOT NULL
GROUP BY DATE_FORMAT(c.created_at, '%Y-%m')
ORDER BY mois;
