-- Connexion Metabase : mission_bd
SELECT
  c.statut_candidature AS statut,
  COUNT(*) AS nombre_candidatures
FROM candidature c
WHERE c.statut_candidature IS NOT NULL
GROUP BY c.statut_candidature;
