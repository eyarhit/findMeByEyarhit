-- cv_bd — compétences les plus citées (colonnes parser CV / formulaire)
SELECT skill_label AS competence, COUNT(*) AS occurrences
FROM (
  SELECT TRIM(c.language_programmation) AS skill_label
  FROM competence c
  INNER JOIN cv_competence cc ON cc.competence_id = c.id_competence
  WHERE c.language_programmation IS NOT NULL AND TRIM(c.language_programmation) <> ''
  UNION ALL
  SELECT TRIM(c.framework) FROM competence c
  INNER JOIN cv_competence cc ON cc.competence_id = c.id_competence
  WHERE c.framework IS NOT NULL AND TRIM(c.framework) <> ''
  UNION ALL
  SELECT TRIM(c.db) FROM competence c
  INNER JOIN cv_competence cc ON cc.competence_id = c.id_competence
  WHERE c.db IS NOT NULL AND TRIM(c.db) <> ''
  UNION ALL
  SELECT TRIM(c.outils) FROM competence c
  INNER JOIN cv_competence cc ON cc.competence_id = c.id_competence
  WHERE c.outils IS NOT NULL AND TRIM(c.outils) <> ''
) skills
GROUP BY skill_label
ORDER BY occurrences DESC
LIMIT 15;
