-- Patch pour volumes MySQL créés avant l'ajout etl_run_log / dim_user_scd2
USE findme_dw;

CREATE TABLE IF NOT EXISTS dim_user_scd2 (
  user_scd_key  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  role_name     VARCHAR(64) NOT NULL,
  status_name   VARCHAR(32) NOT NULL,
  country       VARCHAR(128) NOT NULL,
  valid_from    DATE NOT NULL,
  valid_to      DATE NULL,
  is_current    TINYINT NOT NULL DEFAULT 1,
  KEY idx_scd2_user (user_id),
  KEY idx_scd2_current (user_id, is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS etl_run_log (
  run_id        BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  started_at    DATETIME NOT NULL,
  finished_at   DATETIME NULL,
  status        VARCHAR(16) NOT NULL DEFAULT 'RUNNING',
  rows_loaded   INT NULL,
  error_message TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
