# Module BI Find-Me — Talend + Power BI (PFE ESB)

## Architecture

```
OLTP (5 bases)  →  Talend ETL (talend-etl)  →  findme_dw (étoile)
                                              ↓
                                    Power BI Desktop (.pbix)
                                              ↓
                              Admin Angular (bi-manifest.json)
```

## Démarrage Docker

```cmd
scripts\docker-compose-up-bi.cmd
```

Profil Compose : `bi` (services `talend-etl`, `powerbi-guide`, `powerbi-seed`).

## Structure

| Dossier | Rôle |
|---------|------|
| `01_contexte/` | Cadrage, personas, MoSCoW |
| `dw/` | Schéma en étoile + `dim_localisation` |
| `talend/` | Job Talend (Studio) + runtime Docker |
| `powerbi/` | Rapports Power BI + guide web |
| `kpis/` | Catalogue indicateurs (SQL sur `findme_dw`) |
| `governance/` | DQ, RGPD, dictionnaire |
| `metabase/` | **Archive** (ancienne stack, non branchée) |
| `bi_etl/` | **Archive** (runtime Python historique) |

## Dimensions cours (Temps + Localisation)

- **Temps** : `dim_date` (jour → année, trimestre, week-end)
- **Localisation** : `dim_localisation` (vue ville / pays / zone) + attributs sur `dim_mission`, `dim_user`

## Soutenance

- Slides : `docs/BI_PRESENTATION_PFE.md` (adapter les slides Metabase → Power BI)
- Guide jury : `docs/PROJET_BI_ESB.md`
