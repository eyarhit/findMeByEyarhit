-- Connexion Metabase : mission_bd
-- Répartition des offres / missions selon le type de contrat (fiche descriptive)
SELECT
  d.type_contrat AS type_contrat,
  COUNT(*) AS nombre
FROM mission m
INNER JOIN descrip_mission d ON d.id_mission = m.id_mission
WHERE d.type_contrat IS NOT NULL
GROUP BY d.type_contrat
ORDER BY nombre DESC;
