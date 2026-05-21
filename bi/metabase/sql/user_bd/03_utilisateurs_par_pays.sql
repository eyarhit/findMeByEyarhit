-- user_bd — répartition géographique des profils
SELECT
  COALESCE(NULLIF(TRIM(u.country), ''), 'Non renseigné') AS pays,
  COUNT(*) AS nombre_utilisateurs
FROM users u
GROUP BY COALESCE(NULLIF(TRIM(u.country), ''), 'Non renseigné')
ORDER BY nombre_utilisateurs DESC
LIMIT 15;
