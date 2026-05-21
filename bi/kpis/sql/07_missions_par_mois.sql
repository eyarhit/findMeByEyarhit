SELECT
  CONCAT(d.year_num, '-', LPAD(d.month_num, 2, '0')) AS mois,
  SUM(fm.mission_count) AS missions_creees
FROM fact_mission fm
JOIN dim_date d ON d.date_key = fm.date_key
WHERE fm.date_key > 19000101
GROUP BY d.year_num, d.month_num
ORDER BY mois;
