-- ==========================================
-- Domaine QUIZ (base: quiz_bd)
-- ==========================================

USE quiz_bd;

-- Q8: Score moyen par quiz (modele actuel: vue globale)
-- Pourquoi: surveiller le niveau moyen des passages quiz.
SELECT
  'Quiz global' AS titre,
  ROUND(AVG(COALESCE(uqr.score, 0)), 2) AS score_moyen,
  COUNT(uqr.id) AS nb_passages
FROM user_quiz_results uqr;

-- Q9: Taux de reussite quiz (modele actuel: vue globale)
-- Pourquoi: piloter la difficulte globale des quiz.
SELECT
  'Quiz global' AS titre,
  COUNT(uqr.id) AS total_passages,
  SUM(CASE WHEN COALESCE(uqr.passed, 0) = 1 THEN 1 ELSE 0 END) AS reussis,
  ROUND(
    100.0 * SUM(CASE WHEN COALESCE(uqr.passed, 0) = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(uqr.id), 0),
    2
  ) AS taux_reussite
FROM user_quiz_results uqr;

-- Bonus 1: Distribution des scores par tranches
SELECT
  CASE
    WHEN COALESCE(score, 0) < 25 THEN '00-24'
    WHEN COALESCE(score, 0) < 50 THEN '25-49'
    WHEN COALESCE(score, 0) < 75 THEN '50-74'
    ELSE '75-100'
  END AS tranche_score,
  COUNT(*) AS total
FROM user_quiz_results
GROUP BY tranche_score
ORDER BY tranche_score;

-- Bonus 2: Taux de reussite par utilisateur
SELECT
  COALESCE(user_id, 0) AS user_id,
  COUNT(*) AS tentatives,
  SUM(CASE WHEN COALESCE(passed, 0) = 1 THEN 1 ELSE 0 END) AS reussites,
  ROUND(
    100.0 * SUM(CASE WHEN COALESCE(passed, 0) = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) AS taux_reussite
FROM user_quiz_results
GROUP BY COALESCE(user_id, 0)
ORDER BY taux_reussite DESC, tentatives DESC;

-- Bonus 3: Questions par type
SELECT
  COALESCE(NULLIF(TRIM(type), ''), 'NON_RENSEIGNE') AS type_question,
  COUNT(*) AS total
FROM quiz_questions
GROUP BY COALESCE(NULLIF(TRIM(type), ''), 'NON_RENSEIGNE')
ORDER BY total DESC;

-- ==========================================
-- Exemples de filtres (a injecter dans WHERE)
-- ==========================================
-- 1) Filtrer un utilisateur:
--    WHERE uqr.user_id = 10
--
-- 2) Filtrer les quiz reussis:
--    WHERE uqr.passed = 1
--
-- 3) Filtrer les scores eleves:
--    WHERE uqr.score >= 80
