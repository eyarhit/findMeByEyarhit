SELECT
  CASE WHEN fq.passed = 1 THEN 'Réussi' ELSE 'Non réussi' END AS resultat,
  SUM(fq.attempt_count) AS nombre_tentatives
FROM fact_quiz fq
GROUP BY fq.passed;
