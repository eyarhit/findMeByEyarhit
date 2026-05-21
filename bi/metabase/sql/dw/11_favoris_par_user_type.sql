SELECT ff.user_type AS type_utilisateur, SUM(ff.favori_count) AS nombre_favoris
FROM fact_mission_favori ff
GROUP BY ff.user_type
ORDER BY nombre_favoris DESC;
