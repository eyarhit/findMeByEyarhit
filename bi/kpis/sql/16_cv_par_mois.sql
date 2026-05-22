SELECT
  CONCAT(d.year_num, '-', LPAD(d.month_num, 2, '0')) AS mois,
  COALESCE(SUM(fcv.cv_count), 0) AS cv_crees
FROM dim_date d
LEFT JOIN fact_cv fcv ON fcv.date_key = d.date_key
WHERE d.date_key > 19000101
GROUP BY d.year_num, d.month_num
ORDER BY mois;
