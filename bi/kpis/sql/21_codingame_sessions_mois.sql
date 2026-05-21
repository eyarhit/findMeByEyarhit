SELECT
  CONCAT(d.year_num, '-', LPAD(d.month_num, 2, '0')) AS mois,
  SUM(fcg.session_count) AS sessions_demarrees
FROM fact_codingame fcg
JOIN dim_date d ON d.date_key = fcg.date_key
WHERE fcg.date_key > 19000101
GROUP BY d.year_num, d.month_num
ORDER BY mois;
