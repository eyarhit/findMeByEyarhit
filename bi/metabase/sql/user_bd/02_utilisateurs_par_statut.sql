-- Connexion Metabase : user_bd
-- Graphique suggéré : camembert ou barres
SELECT
  u.status AS statut_compte,
  COUNT(*) AS nombre
FROM users u
WHERE u.status IS NOT NULL
GROUP BY u.status
ORDER BY nombre DESC;
