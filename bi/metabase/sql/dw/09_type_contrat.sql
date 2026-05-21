SELECT dm.type_contrat AS type_contrat, SUM(fm.mission_count) AS nombre
FROM dim_mission dm
JOIN fact_mission fm ON fm.mission_key = dm.mission_key
GROUP BY dm.type_contrat
ORDER BY nombre DESC;
