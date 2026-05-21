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
scripts\bi-start.cmd
```

- **Talend Open Studio** : http://localhost:6080 — [studio-docker/README.md](talend/studio-docker/README.md)
- **Power BI Desktop** : install auto (winget) — [powerbi/README.md](powerbi/README.md)
- **Hub BI** : http://localhost:3032 — [hub/README.md](hub/README.md)

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
