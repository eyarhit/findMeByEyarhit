SELECT dm.status_mission AS statut_mission, SUM(fm.mission_count) AS nombre_missions
FROM dim_mission dm
JOIN fact_mission fm ON fm.mission_key = dm.mission_key
GROUP BY dm.status_mission
ORDER BY nombre_missions DESC;
