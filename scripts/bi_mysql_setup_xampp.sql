-- Setup BI Find-Me (MySQL 8.4 / XAMPP compatible)
-- Execution:
--   mysql -u root -p < scripts/bi_mysql_setup_xampp.sql

CREATE DATABASE IF NOT EXISTS user_bd;
CREATE DATABASE IF NOT EXISTS cv_bd;
CREATE DATABASE IF NOT EXISTS mission_bd;
CREATE DATABASE IF NOT EXISTS quiz_bd;
CREATE DATABASE IF NOT EXISTS codingame_bd;

CREATE USER IF NOT EXISTS 'findme_bi'@'%' IDENTIFIED BY 'findme_bi_readonly';
ALTER USER 'findme_bi'@'%' IDENTIFIED BY 'findme_bi_readonly';

GRANT SELECT ON user_bd.* TO 'findme_bi'@'%';
GRANT SELECT ON cv_bd.* TO 'findme_bi'@'%';
GRANT SELECT ON mission_bd.* TO 'findme_bi'@'%';
GRANT SELECT ON quiz_bd.* TO 'findme_bi'@'%';
GRANT SELECT ON codingame_bd.* TO 'findme_bi'@'%';

FLUSH PRIVILEGES;

USE user_bd;
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
  COALESCE(r.role, 'SANS_ROLE') AS role_name,
  DATE_FORMAT(COALESCE(u.date_of_birth, CURRENT_DATE), '%Y-%m') AS registration_month,
  COUNT(*) AS total_users
FROM users u
LEFT JOIN roles r ON r.role_id = u.role_id
GROUP BY COALESCE(r.role, 'SANS_ROLE'), DATE_FORMAT(COALESCE(u.date_of_birth, CURRENT_DATE), '%Y-%m');

USE cv_bd;
CREATE OR REPLACE VIEW v_cv_stats AS
SELECT
  'CVS_PAR_CANDIDAT' AS metric_type,
  c.user_id AS user_id,
  COUNT(*) AS metric_value,
  NULL AS skill_name
FROM cv c
GROUP BY c.user_id
UNION ALL
SELECT
  'FREQUENCE_COMPETENCE' AS metric_type,
  NULL AS user_id,
  COUNT(*) AS metric_value,
  CAST(COALESCE(cc.competence_id, 0) AS CHAR) AS skill_name
FROM cv_competence cc
GROUP BY CAST(COALESCE(cc.competence_id, 0) AS CHAR);

USE mission_bd;
CREATE OR REPLACE VIEW v_mission_stats AS
SELECT
  'MISSIONS_PAR_STATUT' AS metric_type,
  COALESCE(m.status_mission, 'INCONNU') AS metric_key,
  COUNT(*) AS metric_value,
  NULL AS metric_ratio
FROM mission m
GROUP BY COALESCE(m.status_mission, 'INCONNU')
UNION ALL
SELECT
  'CANDIDATURES_PAR_MISSION' AS metric_type,
  CONCAT('MISSION_', COALESCE(c.mission_id, 0)) AS metric_key,
  COUNT(*) AS metric_value,
  NULL AS metric_ratio
FROM candidature c
GROUP BY c.mission_id
UNION ALL
SELECT
  'TAUX_CONVERSION' AS metric_type,
  'GLOBAL' AS metric_key,
  COUNT(*) AS metric_value,
  ROUND(
    100 * SUM(CASE WHEN COALESCE(c.statut_candidature, 'ENCOURS') = 'ACCEPTER' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) AS metric_ratio
FROM candidature c;

USE quiz_bd;
CREATE OR REPLACE VIEW v_quiz_stats AS
SELECT
  'QUIZ_GLOBAL' AS quiz_name,
  ROUND(AVG(COALESCE(uqr.score, 0)), 2) AS avg_score,
  ROUND(
    100 * SUM(CASE WHEN COALESCE(uqr.passed, 0) = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) AS pass_rate,
  COUNT(*) AS total_attempts
FROM user_quiz_results uqr;

USE codingame_bd;
CREATE OR REPLACE VIEW v_codingame_stats AS
SELECT
  COALESCE(f.name, 'SANS_FRAMEWORK') AS challenge_name,
  ROUND(AVG(COALESCE(er.score, 0)), 2) AS avg_score,
  ROUND(
    100 * SUM(CASE WHEN es.end_time IS NOT NULL THEN 1 ELSE 0 END) / NULLIF(COUNT(es.id), 0),
    2
  ) AS completion_rate,
  COUNT(es.id) AS total_sessions
FROM framework f
LEFT JOIN evaluation_result er ON er.framework_id = f.id
LEFT JOIN evaluation_session es ON es.id = er.session_id
GROUP BY COALESCE(f.name, 'SANS_FRAMEWORK');
