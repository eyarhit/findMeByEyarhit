SELECT
  CASE
    WHEN fcv.steps_completed = 0 THEN 'Aucune étape'
    WHEN fcv.steps_completed BETWEEN 1 AND 3 THEN '1-3 étapes'
    WHEN fcv.steps_completed BETWEEN 4 AND 6 THEN '4-6 étapes'
    ELSE '7+ étapes'
  END AS tranche_etapes,
  SUM(fcv.cv_count) AS nombre_cv
FROM fact_cv fcv
GROUP BY
  CASE
    WHEN fcv.steps_completed = 0 THEN 'Aucune étape'
    WHEN fcv.steps_completed BETWEEN 1 AND 3 THEN '1-3 étapes'
    WHEN fcv.steps_completed BETWEEN 4 AND 6 THEN '4-6 étapes'
    ELSE '7+ étapes'
  END
ORDER BY nombre_cv DESC;
