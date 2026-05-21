-- user_bd — indicateurs exécutifs (une ligne, tableau Metabase)
SELECT
  (SELECT COUNT(*) FROM users) AS total_utilisateurs,
  (SELECT COUNT(*) FROM users u JOIN roles r ON r.role_id = u.role_id WHERE r.role = 'CANDIDAT') AS candidats,
  (SELECT COUNT(*) FROM users u JOIN roles r ON r.role_id = u.role_id WHERE r.role IN ('ESN_ADMIN', 'ESN_COMMARCIAL', 'CHARGEDERECRUTEMENT', 'INTERCONTRAT')) AS recruteurs_esn,
  (SELECT COUNT(*) FROM users u JOIN roles r ON r.role_id = u.role_id WHERE r.role = 'ADMIN') AS administrateurs,
  (SELECT COUNT(*) FROM notification) AS total_notifications,
  (SELECT COUNT(*) FROM document) AS documents_deposes;
