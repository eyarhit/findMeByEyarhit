# Job Talend Open Studio — FindMe_Load_DW

Conforme au **Projet BI ESB** : alimentation automatique de l’entrepôt avec **Talend**.

## Prérequis

- [Talend Open Studio for Data Integration](https://www.talend.com/products/talend-open-studio/) (gratuit)
- MySQL accessible : `localhost:3306` (Docker `findme-mysql`)

## Architecture du job (à reproduire dans le Studio)

| Étape | Composant Talend | Source → Cible |
|-------|------------------|----------------|
| 1 | `tMysqlConnection` | Connexion OLTP + DW |
| 2 | `tMysqlRow` | DDL `findme_dw` (fichier `bi/dw/schema.sql`) |
| 3 | `tMap` + `tMysqlOutput` | **dim_date** (génération 2020–2035) |
| 4 | `tMysqlInput` users + `tMap` | **dim_user** + **fact_user** |
| 5 | `tMysqlInput` missions | **dim_mission** + **fact_mission** |
| 6 | `tMysqlInput` candidatures | **fact_candidature** |
| 7 | `tMysqlInput` CV / quiz / codingame | faits associés |
| 8 | `tMysqlRow` | Journal **etl_run_log** |

Le runtime Docker (`talend-etl`) exécute la **même logique** que ce job (fichier `bi/talend/docker/etl_load_dw.py`) pour garantir la reproductibilité au `docker compose run`.

## Publication Docker (Talend Studio 8+)

1. Clic droit sur le job → **Build Job**
2. **Publish** → type **Docker Image**
3. Image : `findme-talend-load-dw:latest`
4. Variables d’environnement : `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_ETL_USER`, `MYSQL_ETL_PASSWORD`

Référence officielle : [Publishing a Job as a Docker image](https://help.qlik.com/talend/en-US/studio-user-guide/8.0-R2024-09/publishing-job-as-docker-image).

## Dimensions exigées (cours)

| Dimension | Table DW | Contenu |
|-----------|----------|---------|
| **Temps** | `dim_date` | jour, mois, trimestre, week-end |
| **Localisation** | `dim_localisation` (vue) + `dim_mission` / `dim_user` | ville, pays, zone |

## Commande de test

```cmd
docker compose run --rm talend-etl
```
