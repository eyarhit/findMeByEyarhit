-- Base applicative Metabase (remplace H2 dans le volume Docker ; évite corruption / ERR_EMPTY_RESPONSE).
CREATE DATABASE IF NOT EXISTS metabase_app;

DROP USER IF EXISTS 'metabase_app'@'%';
-- MySQL 8.4 : plugin mysql_native_password retiré ; auth par défaut (caching_sha2) + allowPublicKeyRetrieval côté clients JDBC.
CREATE USER 'metabase_app'@'%' IDENTIFIED BY 'FindMe_MetabaseApp_2026_xQ9';

GRANT ALL PRIVILEGES ON metabase_app.* TO 'metabase_app'@'%';
FLUSH PRIVILEGES;
