SELECT
  CONCAT(d.year_num, '-', LPAD(d.month_num, 2, '0')) AS mois,
  SUM(fcv.cv_count) AS cv_crees
FROM fact_cv fcv
JOIN dim_date d ON d.date_key = fcv.date_key
WHERE fcv.date_key > 19000101
GROUP BY d.year_num, d.month_num
ORDER BY mois;
