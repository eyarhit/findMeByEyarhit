SELECT
  (SELECT SUM(user_count) FROM fact_user) AS total_utilisateurs,
  (SELECT SUM(user_count) FROM fact_user fu JOIN dim_user du ON du.user_key = fu.user_key WHERE du.role_name = 'CANDIDAT') AS candidats,
  (SELECT SUM(user_count) FROM fact_user fu JOIN dim_user du ON du.user_key = fu.user_key WHERE du.role_name IN ('ESN_ADMIN','ESN_COMMARCIAL','CHARGEDERECRUTEMENT','INTERCONTRAT')) AS recruteurs_esn,
  (SELECT SUM(mission_count) FROM fact_mission) AS total_missions,
  (SELECT SUM(candidature_count) FROM fact_candidature) AS total_candidatures,
  (SELECT SUM(cv_count) FROM fact_cv) AS total_cv,
  (SELECT SUM(attempt_count) FROM fact_quiz) AS tentatives_quiz,
  (SELECT SUM(session_count) FROM fact_codingame) AS sessions_codingame;
