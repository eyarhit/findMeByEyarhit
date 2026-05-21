SELECT
  ROUND(AVG(fq.score), 1) AS score_moyen,
  SUM(fq.attempt_count) AS tentatives,
  SUM(CASE WHEN fq.passed = 1 THEN fq.attempt_count ELSE 0 END) AS reussites,
  ROUND(100.0 * SUM(CASE WHEN fq.passed = 1 THEN fq.attempt_count ELSE 0 END) / NULLIF(SUM(fq.attempt_count), 0), 1) AS taux_reussite_pct
FROM fact_quiz fq;
