SELECT
  CASE dm.is_remote WHEN 1 THEN 'Télétravail' ELSE 'Sur site' END AS mode_travail,
  SUM(fm.mission_count) AS nombre_missions
FROM dim_mission dm
JOIN fact_mission fm ON fm.mission_key = dm.mission_key
GROUP BY dm.is_remote;
