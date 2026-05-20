-- ==========================================
-- Domaine CV / COMPETENCES (base: cv_bd)
-- ==========================================

USE cv_bd;

-- Q3: Top 10 competences CV
-- Pourquoi: identifier les stacks dominantes dans les candidatures.
SELECT
  COALESCE(
    NULLIF(TRIM(c.language_programmation), ''),
    NULLIF(TRIM(c.framework), ''),
    NULLIF(TRIM(c.bibliotheque), ''),
    NULLIF(TRIM(c.api), ''),
    NULLIF(TRIM(c.db), ''),
    NULLIF(TRIM(c.system_exploitation), ''),
    NULLIF(TRIM(c.conception), ''),
    NULLIF(TRIM(c.methodologie), ''),
    NULLIF(TRIM(c.design_pattern), ''),
    NULLIF(TRIM(c.architechture), ''),
    NULLIF(TRIM(c.outils), ''),
    CONCAT('COMP_', c.id_competence)
  ) AS skill_name,
  COUNT(*) AS frequency
FROM cv_competence cc
LEFT JOIN competence c ON c.id_competence = cc.competence_id
GROUP BY skill_name
ORDER BY frequency DESC
LIMIT 10;

-- Bonus 1: Nombre de CV par candidat
-- Pourquoi: suivre le niveau d'activite de creation/mise a jour de CV.
SELECT
  COALESCE(cv.user_id, 0) AS user_id,
  COUNT(*) AS nb_cv
FROM cv
GROUP BY COALESCE(cv.user_id, 0)
ORDER BY nb_cv DESC;

-- Bonus 2: Nombre d'experiences par CV
-- Pourquoi: evaluer la maturite des profils candidats.
SELECT
  cv.id_cv,
  COUNT(e.id_experience) AS nb_experiences
FROM cv
LEFT JOIN experience e ON e.cv_id_cv = cv.id_cv
GROUP BY cv.id_cv
ORDER BY nb_experiences DESC;

-- Bonus 3: Nombre d'educations par CV
-- Pourquoi: mesurer la densite des parcours academiques.
SELECT
  cv.id_cv,
  COUNT(ed.id_education) AS nb_educations
FROM cv
LEFT JOIN education ed ON ed.cv_id_cv = cv.id_cv
GROUP BY cv.id_cv
ORDER BY nb_educations DESC;

-- ==========================================
-- Exemples de filtres (a injecter dans WHERE)
-- ==========================================
-- 1) Filtrer un candidat:
--    WHERE cv.user_id = 42
--
-- 2) Filtrer une periode de creation de CV:
--    WHERE cv.created_at BETWEEN '2026-01-01' AND '2026-12-31'
--
-- 3) Filtrer une competence:
--    WHERE c.framework = 'Spring Boot'
