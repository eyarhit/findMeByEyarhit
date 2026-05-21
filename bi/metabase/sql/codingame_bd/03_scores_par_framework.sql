-- codingame_bd — score moyen par framework (défi technique)
SELECT
  COALESCE(f.name, 'Sans framework') AS framework,
  ROUND(AVG(er.score), 2) AS score_moyen,
  COUNT(*) AS evaluations
FROM evaluation_result er
LEFT JOIN framework f ON f.id = er.framework_id
GROUP BY COALESCE(f.name, 'Sans framework')
ORDER BY score_moyen DESC;
