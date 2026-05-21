SELECT
  CONCAT(d.year_num, '-', LPAD(d.month_num, 2, '0')) AS mois,
  SUM(fn.notification_count) AS notifications_envoyees,
  SUM(CASE WHEN fn.is_read = 1 THEN fn.notification_count ELSE 0 END) AS lues,
  SUM(CASE WHEN fn.is_read = 0 THEN fn.notification_count ELSE 0 END) AS non_lues
FROM fact_notification fn
JOIN dim_date d ON d.date_key = fn.date_key
WHERE fn.date_key > 19000101
GROUP BY d.year_num, d.month_num
ORDER BY mois;
