-- user_bd — activité notifications (aligné entité Notification.timestamp)
SELECT
  DATE_FORMAT(n.timestamp, '%Y-%m') AS mois,
  COUNT(*) AS notifications_envoyees,
  SUM(CASE WHEN n.is_read = 1 THEN 1 ELSE 0 END) AS lues,
  SUM(CASE WHEN n.is_read = 0 THEN 1 ELSE 0 END) AS non_lues
FROM notification n
WHERE n.timestamp IS NOT NULL
GROUP BY DATE_FORMAT(n.timestamp, '%Y-%m')
ORDER BY mois;
