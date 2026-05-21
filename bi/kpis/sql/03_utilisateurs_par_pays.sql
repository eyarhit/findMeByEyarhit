SELECT du.country AS pays, SUM(fu.user_count) AS nombre_utilisateurs
FROM dim_user du
JOIN fact_user fu ON fu.user_key = du.user_key
WHERE du.user_key > 0
GROUP BY du.country
ORDER BY nombre_utilisateurs DESC
LIMIT 15;
