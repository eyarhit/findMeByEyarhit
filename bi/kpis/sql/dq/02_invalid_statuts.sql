-- DQ-V01 — Statuts candidature hors référentiel
SELECT statut_candidature, COUNT(*) AS n
FROM fact_candidature
WHERE statut_candidature NOT IN ('ENCOURS', 'ACCEPTER', 'REFUSER')
GROUP BY statut_candidature;
