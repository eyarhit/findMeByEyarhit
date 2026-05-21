-- DQ-C02 — Candidatures sans dimension mission
SELECT COUNT(*) AS anomalies
FROM fact_candidature fc
LEFT JOIN dim_mission dm ON dm.mission_key = fc.mission_key
WHERE dm.mission_key IS NULL;
