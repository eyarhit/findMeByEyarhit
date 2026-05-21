# Projet BI ESB — Find-Me (Talend + Power BI)

Conforme au document **Projet BI** (ESB 3LBC-BIS 2025-2026) : modélisation en étoile, **Talend**, **Power BI**, dimensions **Temps** et **Localisation**.

## Stack technique

| Couche | Outil | Livrable |
|--------|-------|----------|
| Sources OLTP | MySQL (5 bases microservices) | `user_bd`, `mission_bd`, `cv_bd`, … |
| Entrepôt | Data Warehouse `findme_dw` | `bi/dw/schema.sql` |
| ETL | **Talend Open Studio** + runtime Docker | `bi/talend/studio/`, service `talend-etl` |
| BI | **Power BI Desktop** | `bi/powerbi/reports/*.pbix` |
| Intégration app | Angular admin | `bi-manifest.json` |

> **Note Power BI et Docker :** Power BI Desktop tourne sur **Windows** (hôte). Docker fournit MySQL + ETL + un **guide web** (`http://localhost:8088`). C’est le schéma standard en PFE quand le jury exige Power BI.

## Démarrage (Amin / jury)

```cmd
git pull
scripts\docker-compose-up-bi.cmd
```

Ou :

```cmd
docker compose up -d
docker compose run --rm talend-etl
docker compose run --rm powerbi-seed
docker compose --profile bi up -d powerbi-guide
```

## Présentation soutenance (plan)

1. **Problématique** — pilotage recrutement Find-Me  
2. **Sources** — 5 bases OLTP, flux applicatif  
3. **Modèle** — schéma en étoile (`bi/dw/schema.md`)  
4. **ETL Talend** — démo Studio + `docker compose run --rm talend-etl`  
5. **Power BI** — 3 rapports + filtres Temps / Localisation  
6. **Gouvernance** — `bi/governance/`, `etl_run_log`  

## Ancienne stack (Metabase)

Remplacée par Talend + Power BI. Fichiers conservés dans `bi/metabase/` à titre d’archive — **non utilisés** par `docker-compose.yml`.
