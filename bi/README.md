# Module BI Find-Me — PFE BIS (Talend + Power BI)

## Stack (alignée formation)

```
OLTP (5 bases)  →  Talend ETL (talend-etl)  →  findme_dw (étoile)
                                              ↓
                                    Power BI Desktop (OLAP)
                                              ↓
                              Admin Angular (guide + KPIs)
```

**Metabase supprimé** — remplacé par **Power BI** (analyse OLAP du cours).

## Démarrage rapide

```cmd
docker compose up -d
```

- **Console BI** (Talend + Power BI navigateur) : http://localhost:3032 — voir [hub/README.md](hub/README.md)
- **Admin Angular** : menu *Tableaux de bord BI* → boutons Talend / Power BI
- ETL manuel optionnel : `docker compose run --rm talend-etl`
- Rapports `.pbix` : `bi/powerbi/README.md`

## Les 6 blocs méthodologiques

| Bloc | Dossier |
|------|---------|
| 1. Cadrage | [01_contexte/](01_contexte/) |
| 2. Modèle DW | [dw/](dw/) |
| 3. Alimentation ETL | [talend/](talend/) |
| 4. KPIs | [kpis/](kpis/) |
| 5. Dashboards OLAP | [powerbi/](powerbi/) |
| 6. Gouvernance | [governance/](governance/) |

## Documentation

- [BI_POWERBI.md](../BI_POWERBI.md)
- [docs/BI_PFE_TALEND_POWERBI.md](../docs/BI_PFE_TALEND_POWERBI.md)
