-- Connexion Metabase : mission_bd
SELECT
  m.status_mission AS statut_mission,
  COUNT(*) AS nombre_missions
FROM mission m
WHERE m.status_mission IS NOT NULL
GROUP BY m.status_mission;
