-- ==========================================
-- Domaine CODINGAME (base: codingame_bd)
-- ==========================================

USE codingame_bd;

-- Q10: Score moyen CodingGame par defi (framework)
-- Pourquoi: comparer les performances techniques par techno.
SELECT
  COALESCE(f.name, CONCAT('Framework #', f.id)) AS title,
  ROUND(AVG(COALESCE(er.score, 0)), 2) AS score_moyen,
  COUNT(er.id) AS nb_tentatives
FROM framework f
LEFT JOIN evaluation_result er ON er.framework_id = f.id
GROUP BY f.id, f.name
ORDER BY score_moyen DESC;

-- Q11: Taux de completion defis CodingGame
-- Pourquoi: suivre la capacite des candidats a terminer les sessions.
SELECT
  COALESCE(f.name, CONCAT('Framework #', f.id)) AS title,
  COUNT(es.id) AS tentatives,
  SUM(CASE WHEN es.end_time IS NOT NULL THEN 1 ELSE 0 END) AS completes,
  ROUND(
    100.0 * SUM(CASE WHEN es.end_time IS NOT NULL THEN 1 ELSE 0 END) / NULLIF(COUNT(es.id), 0),
    2
  ) AS taux_completion
FROM framework f
LEFT JOIN evaluation_result er ON er.framework_id = f.id
LEFT JOIN evaluation_session es ON es.id = er.session_id
GROUP BY f.id, f.name
ORDER BY taux_completion DESC, tentatives DESC;

-- Bonus 1: Sessions par domaine
SELECT
  COALESCE(d.name, 'SANS_DOMAINE') AS domaine,
  COUNT(es.id) AS nb_sessions
FROM evaluation_session es
LEFT JOIN domain d ON d.id = es.domain_id
GROUP BY COALESCE(d.name, 'SANS_DOMAINE')
ORDER BY nb_sessions DESC;

-- Bonus 2: Score moyen par niveau d'experience
SELECT
  COALESCE(el.name, 'SANS_NIVEAU') AS niveau,
  ROUND(AVG(COALESCE(es.total_score, 0)), 2) AS score_moyen,
  COUNT(es.id) AS nb_sessions
FROM evaluation_session es
LEFT JOIN experiencelevel el ON el.id = es.level_id
GROUP BY COALESCE(el.name, 'SANS_NIVEAU')
ORDER BY score_moyen DESC;

-- Bonus 3: Duree moyenne des sessions (minutes)
SELECT
  ROUND(AVG(TIMESTAMPDIFF(MINUTE, es.start_time, es.end_time)), 2) AS duree_moyenne_minutes
FROM evaluation_session es
WHERE es.start_time IS NOT NULL
  AND es.end_time IS NOT NULL;

-- ==========================================
-- Exemples de filtres (a injecter dans WHERE)
-- ==========================================
-- 1) Filtrer un framework:
--    WHERE f.name = 'Spring'
--
-- 2) Filtrer une plage de score:
--    WHERE er.score BETWEEN 50 AND 100
--
-- 3) Filtrer sur les sessions terminees:
--    WHERE es.end_time IS NOT NULL
