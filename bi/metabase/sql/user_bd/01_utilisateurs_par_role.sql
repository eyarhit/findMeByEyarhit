-- Connexion Metabase : user_bd
-- Graphique suggéré : barres horizontales — Axe X : nb, Axe Y : role
SELECT
  r.role AS role_utilisateur,
  COUNT(*) AS nombre_utilisateurs
FROM users u
JOIN roles r ON r.role_id = u.role_id
GROUP BY r.role
ORDER BY nombre_utilisateurs DESC;
