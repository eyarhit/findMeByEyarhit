-- Connexion Metabase : mission_bd
-- Graphique suggéré : ligne ou barres — Axe X : mois
SELECT
  DATE_FORMAT(m.created_at, '%Y-%m') AS mois,
  COUNT(*) AS missions_creees
FROM mission m
WHERE m.created_at IS NOT NULL
GROUP BY DATE_FORMAT(m.created_at, '%Y-%m')
ORDER BY mois;
