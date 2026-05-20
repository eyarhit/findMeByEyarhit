-- Connexion Metabase : mission_bd
-- Qui met en favori les missions (profil métier côté Find-Me)
SELECT
  mf.user_type AS type_utilisateur,
  COUNT(*) AS nombre_favoris
FROM mission_favoris mf
WHERE mf.user_type IS NOT NULL
GROUP BY mf.user_type
ORDER BY nombre_favoris DESC;
