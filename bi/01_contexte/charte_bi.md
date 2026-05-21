# Charte BI Find-Me (Bloc 1 — livrable signé)

| Champ | Valeur |
|-------|--------|
| **Projet** | Find-Me — plateforme de matching candidats / missions ESN |
| **Sponsor** | Direction produit / ADMIN plateforme |
| **Périmètre** | Recrutement, workforce, compétences CV, évaluations, opérations missions |
| **Hors périmètre** | Paie, absentéisme, turnover SIRH, NPS, ERP production |
| **Outil BI** | Metabase OSS + entrepôt MySQL `findme_dw` |
| **Public** | ADMIN (app), jury PFE, équipe technique |
| **Objectif** | Décision data-driven sur le pipeline recrutement et l’activité plateforme |
| **Critère de succès** | 23 KPIs alimentés après ETL, 3 dashboards, export PDF Metabase, doc gouvernance |

## Principes directeurs

1. **Une seule source analytique** : `findme_dw` (pas de requêtes BI directes sur OLTP en production).
2. **Réplicabilité** : ETL + seed documentés et exécutables via Docker.
3. **Transparence** : chaque KPI a une formule dans `kpis/kpis_catalogue.md`.
4. **Sécurité** : lecture seule `findme_bi`, pas de PII nominative dans l’entrepôt.

## Jalons

| Jalon | Livrable |
|-------|----------|
| J1 | Schéma étoile validé (`dw/schema.sql`) |
| J2 | ETL stable (`bi_etl`) |
| J3 | Catalogue KPI + SQL |
| J4 | 3 dashboards Metabase |
| J5 | Gouvernance + soutenance |
