-- ==========================================
-- Domaine USERS (base: user_bd)
-- ==========================================

USE user_bd;

-- Q1: Utilisateurs par role
-- Pourquoi: mesurer la repartition de la population (ADMIN, CANDIDAT, roles recruteurs).
SELECT
  COALESCE(r.role, 'SANS_ROLE') AS role,
  COUNT(*) AS total
FROM users u
LEFT JOIN roles r ON r.role_id = u.role_id
GROUP BY COALESCE(r.role, 'SANS_ROLE')
ORDER BY total DESC;

-- Q2: Inscriptions par mois (proxy temporel selon les colonnes disponibles)
-- Pourquoi: suivre la tendance de croissance mensuelle.
SELECT
  DATE_FORMAT(COALESCE(u.date_of_birth, CURRENT_DATE), '%Y-%m') AS mois,
  COUNT(*) AS inscriptions
FROM users u
GROUP BY DATE_FORMAT(COALESCE(u.date_of_birth, CURRENT_DATE), '%Y-%m')
ORDER BY mois ASC;

-- Q12: Vue globale KPIs
-- Pourquoi: vision executive immediate des effectifs principaux.
SELECT
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM users u LEFT JOIN roles r ON r.role_id = u.role_id WHERE COALESCE(r.role, '') = 'CANDIDAT') AS candidats,
  (SELECT COUNT(*) FROM users u LEFT JOIN roles r ON r.role_id = u.role_id WHERE COALESCE(r.role, '') IN ('ESN_ADMIN', 'ESN_COMMARCIAL', 'CHARGEDERECRUTEMENT', 'INTERCONTRAT')) AS recruteurs;

-- Bonus 1: Top pays de residence des utilisateurs
SELECT
  COALESCE(NULLIF(TRIM(u.country), ''), 'NON_RENSEIGNE') AS pays,
  COUNT(*) AS total
FROM users u
GROUP BY COALESCE(NULLIF(TRIM(u.country), ''), 'NON_RENSEIGNE')
ORDER BY total DESC
LIMIT 10;

-- Bonus 2: Utilisateurs par statut de compte
SELECT
  COALESCE(CAST(u.status AS CHAR), 'INCONNU') AS statut_compte,
  COUNT(*) AS total
FROM users u
GROUP BY COALESCE(CAST(u.status AS CHAR), 'INCONNU')
ORDER BY total DESC;

-- Bonus 3: Repartition par sexe
SELECT
  COALESCE(NULLIF(TRIM(u.sexe), ''), 'NON_RENSEIGNE') AS sexe,
  COUNT(*) AS total
FROM users u
GROUP BY COALESCE(NULLIF(TRIM(u.sexe), ''), 'NON_RENSEIGNE')
ORDER BY total DESC;

-- ==========================================
-- Exemples de filtres (a injecter dans WHERE)
-- ==========================================
-- 1) Filtrer sur un role:
--    WHERE r.role = 'CANDIDAT'
--
-- 2) Filtrer sur un pays:
--    WHERE COALESCE(u.country, '') = 'France'
--
-- 3) Filtrer sur une tranche d'ID (approximation temporelle):
--    WHERE u.user_id BETWEEN 100 AND 500
