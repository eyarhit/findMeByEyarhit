-- mission_bd — missions les plus sollicitées
SELECT
  COALESCE(d.mission_name, CONCAT('Mission #', m.id_mission)) AS mission,
  m.reference_code AS reference,
  COUNT(c.id_candidature) AS nombre_candidatures
FROM mission m
LEFT JOIN descrip_mission d ON d.id_mission = m.id_mission
LEFT JOIN candidature c ON c.mission_id = m.id_mission
GROUP BY m.id_mission, d.mission_name, m.reference_code
HAVING nombre_candidatures > 0
ORDER BY nombre_candidatures DESC
LIMIT 10;
