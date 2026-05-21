-- cv_bd — avancement formulaire CV (cv_completed_steps)
SELECT
  CONCAT('Étape ', s.step_number) AS etape,
  COUNT(DISTINCT s.cv_id) AS cv_concernes
FROM cv_completed_steps s
GROUP BY s.step_number
ORDER BY s.step_number;
