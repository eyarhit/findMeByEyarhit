-- Connexion Metabase : mission_bd
SELECT
  COALESCE(v.nomdeville, '(Non renseigné)') AS ville,
  COUNT(*) AS nombre_missions
FROM mission m
LEFT JOIN ville v ON v.id_ville = m.ville_id
GROUP BY v.id_ville, v.nomdeville
ORDER BY nombre_missions DESC
LIMIT 15;
