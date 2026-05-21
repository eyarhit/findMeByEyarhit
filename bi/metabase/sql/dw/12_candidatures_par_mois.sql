SELECT
  CONCAT(d.year_num, '-', LPAD(d.month_num, 2, '0')) AS mois,
  SUM(fc.candidature_count) AS candidatures
FROM fact_candidature fc
JOIN dim_date d ON d.date_key = fc.date_key
WHERE fc.date_key > 19000101
GROUP BY d.year_num, d.month_num
ORDER BY mois;
