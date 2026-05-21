SELECT dm.ville AS ville, SUM(fm.mission_count) AS nombre_missions
FROM dim_mission dm
JOIN fact_mission fm ON fm.mission_key = dm.mission_key
GROUP BY dm.ville
ORDER BY nombre_missions DESC
LIMIT 15;
