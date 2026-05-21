-- =============================================================================
-- Find-Me — Entrepôt décisionnel findme_dw (schéma en étoile / Kimball)
-- Source de vérité : bi/dw/schema.sql
-- Appliqué par : bi-etl (ensure_schema) ou mysql-init au premier démarrage
-- =============================================================================

CREATE DATABASE IF NOT EXISTS findme_dw;
USE findme_dw;

-- ---------------------------------------------------------------------------
-- DIMENSIONS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS dim_date (
  date_key      INT NOT NULL PRIMARY KEY COMMENT 'Format YYYYMMDD',
  full_date     DATE NOT NULL UNIQUE,
  year_num      SMALLINT NOT NULL,
  month_num     TINYINT NOT NULL,
  quarter_num   TINYINT NOT NULL,
  month_name    VARCHAR(20) NOT NULL,
  day_of_week   TINYINT NOT NULL COMMENT 'ISO 1=lundi … 7=dimanche',
  week_of_year  TINYINT NOT NULL,
  is_weekend    TINYINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Dimension temps — grain : jour calendaire';

CREATE TABLE IF NOT EXISTS dim_user (
  user_key      INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT NOT NULL COMMENT 'Clé naturelle user_bd.users',
  role_name     VARCHAR(64) NOT NULL DEFAULT 'INCONNU',
  status_name   VARCHAR(32) NOT NULL DEFAULT 'INCONNU',
  country       VARCHAR(128) NOT NULL DEFAULT 'Non renseigné',
  sexe          VARCHAR(32) NOT NULL DEFAULT 'Non renseigné',
  UNIQUE KEY uk_dim_user_natural (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Dimension utilisateur — SCD Type 1 (dernière image)';

-- SCD Type 2 (historique RH) — alimentation ETL phase 2
CREATE TABLE IF NOT EXISTS dim_user_scd2 (
  user_scd_key  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  role_name     VARCHAR(64) NOT NULL,
  status_name   VARCHAR(32) NOT NULL,
  country       VARCHAR(128) NOT NULL,
  valid_from    DATE NOT NULL,
  valid_to      DATE NULL COMMENT 'NULL = version courante',
  is_current    TINYINT NOT NULL DEFAULT 1,
  KEY idx_scd2_user (user_id),
  KEY idx_scd2_current (user_id, is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Dimension utilisateur — SCD Type 2 (historique rôle/statut/pays)';

CREATE TABLE IF NOT EXISTS dim_mission (
  mission_key       INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  mission_id        BIGINT NOT NULL COMMENT 'Clé naturelle mission_bd.mission',
  status_mission    VARCHAR(32) NOT NULL DEFAULT 'INCONNU',
  type_contrat      VARCHAR(64) NOT NULL DEFAULT 'Non renseigné',
  is_remote         TINYINT NOT NULL DEFAULT 0,
  ville             VARCHAR(128) NOT NULL DEFAULT 'Non renseigné',
  pays              VARCHAR(128) NOT NULL DEFAULT 'Non renseigné',
  mission_name      VARCHAR(255) NOT NULL DEFAULT '',
  reference_code    VARCHAR(64) NOT NULL DEFAULT '',
  UNIQUE KEY uk_dim_mission_natural (mission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Dimension offre / mission';

CREATE TABLE IF NOT EXISTS dim_skill (
  skill_key       INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  skill_label     VARCHAR(255) NOT NULL,
  skill_category  VARCHAR(64) NOT NULL COMMENT 'Langage, Framework, Base de données, Outils',
  usage_count     INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_dim_skill (skill_label, skill_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Dimension compétence (agrégée depuis CV)';

-- ---------------------------------------------------------------------------
-- TABLES DE FAITS (mesures additives sauf taux calculés en requête)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fact_user (
  user_key      INT NOT NULL PRIMARY KEY,
  user_count    INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_fact_user_dim FOREIGN KEY (user_key) REFERENCES dim_user(user_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Fait snapshot — grain : 1 utilisateur actif';

CREATE TABLE IF NOT EXISTS fact_notification (
  notification_key   BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  date_key             INT NOT NULL,
  user_id_degen        VARCHAR(64) NOT NULL DEFAULT '',
  is_read              TINYINT NOT NULL DEFAULT 0,
  notification_count   INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_fact_notif_date FOREIGN KEY (date_key) REFERENCES dim_date(date_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Fait notification — grain : 1 notification';

CREATE TABLE IF NOT EXISTS fact_mission (
  mission_key         INT NOT NULL PRIMARY KEY,
  date_key            INT NOT NULL,
  publisher_user_id   BIGINT NULL,
  mission_count       INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_fact_mission_dim FOREIGN KEY (mission_key) REFERENCES dim_mission(mission_key),
  CONSTRAINT fk_fact_mission_date FOREIGN KEY (date_key) REFERENCES dim_date(date_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Fait mission — grain : 1 mission créée';

CREATE TABLE IF NOT EXISTS fact_candidature (
  candidature_key     BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  date_key            INT NOT NULL,
  mission_key         INT NOT NULL,
  candidat_user_id    BIGINT NOT NULL,
  statut_candidature  VARCHAR(32) NOT NULL,
  candidature_count   INT NOT NULL DEFAULT 1,
  is_accepted         TINYINT NOT NULL DEFAULT 0,
  is_refused          TINYINT NOT NULL DEFAULT 0,
  is_en_cours         TINYINT NOT NULL DEFAULT 0,
  CONSTRAINT fk_fact_cand_date FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
  CONSTRAINT fk_fact_cand_mission FOREIGN KEY (mission_key) REFERENCES dim_mission(mission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Fait recrutement — grain : 1 candidature';

CREATE TABLE IF NOT EXISTS fact_mission_favori (
  favori_key      BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  date_key        INT NOT NULL,
  mission_key     INT NOT NULL,
  user_type       VARCHAR(64) NOT NULL,
  favori_count    INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_fact_fav_date FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
  CONSTRAINT fk_fact_fav_mission FOREIGN KEY (mission_key) REFERENCES dim_mission(mission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Fait favori — grain : 1 mise en favori';

CREATE TABLE IF NOT EXISTS fact_cv (
  cv_key            BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  date_key          INT NOT NULL,
  user_key          INT NOT NULL,
  cv_count          INT NOT NULL DEFAULT 1,
  steps_completed   INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_fact_cv_date FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
  CONSTRAINT fk_fact_cv_user FOREIGN KEY (user_key) REFERENCES dim_user(user_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Fait CV — grain : 1 CV';

CREATE TABLE IF NOT EXISTS fact_quiz (
  quiz_key        BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  date_key        INT NOT NULL,
  user_key        INT NOT NULL,
  score           INT NOT NULL DEFAULT 0,
  passed          TINYINT NOT NULL DEFAULT 0,
  attempt_count   INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_fact_quiz_date FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
  CONSTRAINT fk_fact_quiz_user FOREIGN KEY (user_key) REFERENCES dim_user(user_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Fait quiz — grain : 1 tentative';

CREATE TABLE IF NOT EXISTS fact_codingame (
  codingame_key   BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  date_key        INT NOT NULL,
  user_key        INT NOT NULL,
  framework_name  VARCHAR(128) NOT NULL DEFAULT 'Sans framework',
  score           DOUBLE NOT NULL DEFAULT 0,
  total_score     DOUBLE NULL,
  session_count   INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_fact_cg_date FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
  CONSTRAINT fk_fact_cg_user FOREIGN KEY (user_key) REFERENCES dim_user(user_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Fait évaluation technique — grain : 1 résultat session/framework';

-- ---------------------------------------------------------------------------
-- GOUVERNANCE ETL
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS etl_run_log (
  run_id        BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  started_at    DATETIME NOT NULL,
  finished_at   DATETIME NULL,
  status        VARCHAR(16) NOT NULL DEFAULT 'RUNNING',
  rows_loaded   INT NULL,
  error_message TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Journal des exécutions ETL (fraîcheur données)';

-- ---------------------------------------------------------------------------
-- VUES MÉTIER (Metabase / OLAP léger)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_bi_candidature AS
SELECT
  d.full_date,
  d.year_num,
  d.month_num,
  d.month_name,
  m.mission_name,
  m.reference_code,
  m.status_mission,
  m.type_contrat,
  m.ville,
  m.pays,
  f.statut_candidature,
  f.candidature_count,
  f.is_accepted,
  f.is_refused,
  f.is_en_cours,
  f.candidat_user_id
FROM fact_candidature f
JOIN dim_date d ON d.date_key = f.date_key
JOIN dim_mission m ON m.mission_key = f.mission_key;

CREATE OR REPLACE VIEW v_bi_mission AS
SELECT
  d.full_date,
  d.year_num,
  d.month_num,
  m.mission_name,
  m.status_mission,
  m.type_contrat,
  m.is_remote,
  m.ville,
  m.pays,
  f.mission_count,
  f.publisher_user_id
FROM fact_mission f
JOIN dim_date d ON d.date_key = f.date_key
JOIN dim_mission m ON m.mission_key = f.mission_key;

CREATE OR REPLACE VIEW v_bi_kpi_recrutement AS
SELECT
  d.year_num,
  d.month_num,
  SUM(fc.candidature_count) AS candidatures,
  SUM(fc.is_accepted) AS acceptees,
  SUM(fc.is_refused) AS refusees,
  ROUND(100.0 * SUM(fc.is_accepted) / NULLIF(SUM(fc.candidature_count), 0), 1) AS taux_acceptation_pct
FROM fact_candidature fc
JOIN dim_date d ON d.date_key = fc.date_key
WHERE fc.date_key > 19000101
GROUP BY d.year_num, d.month_num;

-- Dimension Localisation (exigence cours BI — grain ville + pays)
CREATE OR REPLACE VIEW dim_localisation AS
SELECT
  ROW_NUMBER() OVER (ORDER BY pays, ville) AS localisation_key,
  ville,
  pays,
  CASE
    WHEN pays IN ('France', 'Tunisie', 'Maroc', 'Algérie') THEN pays
    WHEN pays = 'Non renseigné' THEN 'Non classé'
    ELSE 'International'
  END AS zone_geo
FROM (
  SELECT DISTINCT COALESCE(NULLIF(TRIM(ville), ''), 'Non renseigné') AS ville,
         COALESCE(NULLIF(TRIM(pays), ''), 'Non renseigné') AS pays
  FROM dim_mission
  UNION
  SELECT DISTINCT 'Non renseigné' AS ville,
         COALESCE(NULLIF(TRIM(country), ''), 'Non renseigné') AS pays
  FROM dim_user
  WHERE user_key > 0
) AS loc;
