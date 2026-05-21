-- mission_bd — répartition télétravail (descrip_mission.is_remote)
SELECT
  CASE
    WHEN d.is_remote = 1 THEN 'Télétravail'
    WHEN d.is_remote = 0 THEN 'Sur site'
    ELSE 'Non renseigné'
  END AS mode_travail,
  COUNT(*) AS nombre_missions
FROM mission m
INNER JOIN descrip_mission d ON d.id_mission = m.id_mission
GROUP BY
  CASE
    WHEN d.is_remote = 1 THEN 'Télétravail'
    WHEN d.is_remote = 0 THEN 'Sur site'
    ELSE 'Non renseigné'
  END;
