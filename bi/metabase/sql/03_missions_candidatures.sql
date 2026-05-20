-- ==========================================
-- Domaine MISSIONS / CANDIDATURES (base: mission_bd)
-- ==========================================

USE mission_bd;

-- Q4: Missions par statut
-- Pourquoi: suivre le stock d'offres ouvertes/fermees.
SELECT
  COALESCE(m.status_mission, 'INCONNU') AS statut,
  COUNT(*) AS total
FROM mission m
GROUP BY COALESCE(m.status_mission, 'INCONNU')
ORDER BY total DESC;

-- Q5: Candidatures par mission (Top 10)
-- Pourquoi: detecter les missions les plus attractives.
SELECT
  COALESCE(dm.mission_name, CONCAT('Mission #', m.id_mission)) AS titre,
  COUNT(c.id_candidature) AS nb_candidatures
FROM mission m
LEFT JOIN candidature c ON c.mission_id = m.id_mission
LEFT JOIN descrip_mission dm ON dm.id_mission = m.id_mission
GROUP BY m.id_mission, dm.mission_name
ORDER BY nb_candidatures DESC
LIMIT 10;

-- Q6: Taux de conversion candidatures
-- Pourquoi: mesurer l'efficacite du processus de recrutement.
SELECT
  COUNT(*) AS total_candidatures,
  SUM(CASE WHEN COALESCE(statut_candidature, 'ENCOURS') = 'ACCEPTER' THEN 1 ELSE 0 END) AS acceptees,
  ROUND(
    100.0 * SUM(CASE WHEN COALESCE(statut_candidature, 'ENCOURS') = 'ACCEPTER' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) AS taux_conversion
FROM candidature;

-- Q7: Evolution candidatures par mois
-- Pourquoi: anticiper les pics de charge cote recruteurs.
SELECT
  DATE_FORMAT(COALESCE(date_postulation, CURRENT_DATE), '%Y-%m') AS mois,
  COUNT(*) AS total
FROM candidature
GROUP BY DATE_FORMAT(COALESCE(date_postulation, CURRENT_DATE), '%Y-%m')
ORDER BY mois ASC;

-- Bonus 1: Candidatures par statut
SELECT
  COALESCE(statut_candidature, 'INCONNU') AS statut_candidature,
  COUNT(*) AS total
FROM candidature
GROUP BY COALESCE(statut_candidature, 'INCONNU')
ORDER BY total DESC;

-- Bonus 2: Missions par type de contrat
SELECT
  COALESCE(dm.type_contrat, 'INCONNU') AS type_contrat,
  COUNT(*) AS total
FROM mission m
LEFT JOIN descrip_mission dm ON dm.id_mission = m.id_mission
GROUP BY COALESCE(dm.type_contrat, 'INCONNU')
ORDER BY total DESC;

-- Bonus 3: Delai moyen de traitement (jours)
SELECT
  ROUND(AVG(TIMESTAMPDIFF(DAY, COALESCE(c.date_postulation, CURRENT_DATE), COALESCE(m.created_at, CURRENT_DATE))), 2) AS delai_moyen_jours
FROM candidature c
LEFT JOIN mission m ON m.id_mission = c.mission_id;

-- ==========================================
-- Exemples de filtres (a injecter dans WHERE)
-- ==========================================
-- 1) Filtrer par mois:
--    WHERE c.date_postulation BETWEEN '2026-01-01' AND '2026-03-31'
--
-- 2) Filtrer par mission:
--    WHERE c.mission_id = 12
--
-- 3) Filtrer par statut candidature:
--    WHERE c.statut_candidature = 'ENCOURS'
