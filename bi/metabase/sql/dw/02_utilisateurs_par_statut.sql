SELECT du.status_name AS statut_compte, SUM(fu.user_count) AS nombre
FROM dim_user du
JOIN fact_user fu ON fu.user_key = du.user_key
WHERE du.user_key > 0
GROUP BY du.status_name
ORDER BY nombre DESC;
