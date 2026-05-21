# Business Intelligence — Talend + Power BI (PFE BIS)

Stack alignée sur le cours **Introduction DW → Modélisation → Alimentation ETL → Analyse OLAP**.

| Phase cours | Technologie | Livrable |
|-------------|-------------|----------|
| Entrepôt | MySQL `findme_dw` | `bi/dw/schema.sql` |
| **Alimentation** | **Talend** (+ runtime `talend-etl`) | `bi/talend/studio/FindMe_Load_DW/` |
| **Analyse OLAP** | **Power BI Desktop** | `bi/powerbi/reports/*.pbix` |
| Gouvernance | DQ + catalogue KPI | `bi/governance/`, `bi/kpis/` |

## Démarrage Docker

```cmd
docker compose up -d
docker compose run --rm talend-etl
```

Ou : `scripts\docker-compose-up.cmd`

## Power BI

1. Installer **Power BI Desktop** (Windows).
2. Se connecter à `localhost:3306` / `findme_dw` / `findme_bi` / `findme_bi_readonly`.
3. Suivre `bi/powerbi/README.md` pour créer les 3 rapports.

## Admin Angular

http://localhost:4200 → espace admin → **BI** (manifest `assets/bi/bi-manifest.json`).

## Documentation PFE

- `docs/BI_PFE_TALEND_POWERBI.md` — soutenance jury
- `docs/BI_PRESENTATION_PFE.md` — slides (à adapter Talend/Power BI)

**Metabase** : retiré du projet (hors programme formation).
