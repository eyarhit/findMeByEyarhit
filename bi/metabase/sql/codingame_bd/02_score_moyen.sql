-- Connexion Metabase : codingame_bd
-- Score global agrégé par session (champ total_score)
SELECT
  ROUND(AVG(es.total_score), 2) AS score_moyen_global,
  COUNT(*) AS nombre_sessions
FROM evaluation_session es
WHERE es.total_score IS NOT NULL;
