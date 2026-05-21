# PFE — Module BI (Talend + Power BI)

## Message au jury (30 secondes)

> Nous avons conçu un **entrepôt décisionnel** `findme_dw` en **schéma en étoile**, alimenté par un processus **ETL Talend** (extraction des 5 bases OLTP, transformation, chargement), puis exploité en **analyse OLAP** avec **Microsoft Power BI** (mesures, dimensions, drill-down). La chaîne est reproductible via **Docker** pour l’ETL et MySQL.

## Cartographie cours ↔ projet

| Chapitre PDF (BIS) | Réalisation Find-Me |
|--------------------|---------------------|
| Introduction DW | `findme_dw`, séparation OLTP / analytique |
| Modélisation multidimensionnelle | Faits + dimensions + hiérarchie temps |
| Niveau conceptuel | `bi/01_contexte/`, `bi/dw/schema.md` |
| Niveau logique | Tables `dim_*`, `fact_*`, vues `v_bi_*` |
| Niveau physique | Talend Studio + MySQL + Power BI |
| ETL Extract | `tMysqlInput` / sources JDBC documentées |
| ETL Transform | `tMap`, règles COALESCE, statuts |
| ETL Load | Chargement `findme_dw` |
| Analyse OLAP | Power BI : slice, dice, drill |

## Technologies (exactement formation)

- **Talend Open Studio** — Docker `talend-studio` → http://localhost:6080
- **Docker ETL** — `talend-etl` / Hub BI http://localhost:3032
- **MySQL 8** — entrepôt + compte lecture `findme_bi`
- **Power BI Report Server** — Docker Windows → http://localhost:8077/reports (3 rapports .pbix)

**Non utilisé** : Metabase, Superset, outils hors cours.

## Démo (ordre)

1. `docker compose run --rm talend-etl` → logs SUCCESS + DQ
2. phpMyAdmin / client SQL → `SELECT COUNT(*) FROM findme_dw.fact_candidature`
3. Power BI → rapport Executive → filtre mois + mission
4. Capture job Talend Studio (graphique `FindMe_Load_DW`)

## Tests

| Test | Preuve |
|------|--------|
| ETL | `etl_run_log.status = SUCCESS` |
| DQ | Logs `DQ-C02`, `DQ-V01`, `DQ-C03` OK |
| Sécurité BI | Power BI utilise `findme_bi` (SELECT only) |
| OLAP | Drill-down date / statut dans Power BI |

## Fichiers jury

- `bi/talend/studio/FindMe_Load_DW/README.md`
- `bi/powerbi/README.md`
- `bi/kpis/kpis_catalogue.md`
- `bi/dw/schema.sql`
