-- Connexion Metabase : mission_bd
SELECT
  DATE_FORMAT(c.date_postulation, '%Y-%m') AS mois,
  COUNT(*) AS candidatures
FROM candidature c
WHERE c.date_postulation IS NOT NULL
GROUP BY DATE_FORMAT(c.date_postulation, '%Y-%m')
ORDER BY mois;
