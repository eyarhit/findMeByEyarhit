SELECT
  fcg.framework_name AS framework,
  ROUND(AVG(fcg.score), 2) AS score_moyen,
  SUM(fcg.session_count) AS evaluations
FROM fact_codingame fcg
GROUP BY fcg.framework_name
ORDER BY score_moyen DESC;
