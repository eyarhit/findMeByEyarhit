-- Utilisateur lecture seule pour Metabase / outils BI (mot de passe à changer en prod).
DROP USER IF EXISTS 'findme_bi'@'%';
CREATE USER 'findme_bi'@'%' IDENTIFIED BY 'findme_bi_readonly';

GRANT SELECT ON user_bd.* TO 'findme_bi'@'%';
GRANT SELECT ON cv_bd.* TO 'findme_bi'@'%';
GRANT SELECT ON mission_bd.* TO 'findme_bi'@'%';
GRANT SELECT ON quiz_bd.* TO 'findme_bi'@'%';
GRANT SELECT ON codingame_bd.* TO 'findme_bi'@'%';

FLUSH PRIVILEGES;
