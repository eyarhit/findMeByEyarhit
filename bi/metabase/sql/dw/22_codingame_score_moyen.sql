SELECT
  ROUND(AVG(fcg.total_score), 2) AS score_moyen_global,
  SUM(fcg.session_count) AS nombre_sessions
FROM fact_codingame fcg
WHERE fcg.total_score IS NOT NULL;
