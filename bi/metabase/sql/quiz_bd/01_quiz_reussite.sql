-- Connexion Metabase : quiz_bd
SELECT
  CASE WHEN uqr.passed = 1 THEN 'Réussi' ELSE 'Non réussi' END AS resultat,
  COUNT(*) AS nombre_tentatives
FROM user_quiz_results uqr
GROUP BY uqr.passed;
