-- findme_dw — dimension utilisateurs (schéma en étoile)
SELECT du.role_name AS role_utilisateur, SUM(fu.user_count) AS nombre_utilisateurs
FROM dim_user du
JOIN fact_user fu ON fu.user_key = du.user_key
WHERE du.user_key > 0
GROUP BY du.role_name
ORDER BY nombre_utilisateurs DESC;
