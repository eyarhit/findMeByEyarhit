SELECT
  dm.mission_name AS mission,
  dm.reference_code AS reference,
  SUM(fc.candidature_count) AS nombre_candidatures
FROM fact_candidature fc
JOIN dim_mission dm ON dm.mission_key = fc.mission_key
GROUP BY dm.mission_key, dm.mission_name, dm.reference_code
ORDER BY nombre_candidatures DESC
LIMIT 10;
