-- quiz_bd — performance globale quiz onboarding
SELECT
  ROUND(AVG(uqr.score), 1) AS score_moyen,
  COUNT(*) AS tentatives,
  SUM(CASE WHEN uqr.passed = 1 THEN 1 ELSE 0 END) AS reussites,
  ROUND(100.0 * SUM(CASE WHEN uqr.passed = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) AS taux_reussite_pct
FROM user_quiz_results uqr;
