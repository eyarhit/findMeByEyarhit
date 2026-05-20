-- Connexion Metabase : codingame_bd
SELECT
  DATE_FORMAT(es.start_time, '%Y-%m') AS mois,
  COUNT(*) AS sessions_demarrees
FROM evaluation_session es
WHERE es.start_time IS NOT NULL
GROUP BY DATE_FORMAT(es.start_time, '%Y-%m')
ORDER BY mois;
