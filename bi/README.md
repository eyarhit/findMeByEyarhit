# Find-Me BI — 6 blocs (tous complétés)

| Bloc | Dossier | Statut |
|------|---------|--------|
| **1. Cadrage** | [01_contexte/](01_contexte/) | ✅ |
| **2. Modèle SQL** | [dw/](dw/) | ✅ |
| **3. ETL** | [bi_etl/](bi_etl/) | ✅ |
| **4. KPIs** | [kpis/](kpis/) | ✅ |
| **5. Dashboards** | [dashboards/](dashboards/) + seed Metabase | ✅ |
| **6. Gouvernance** | [governance/](governance/) | ✅ |

## Démarrage rapide

```powershell
docker compose up -d --build
# ou après utilisation de l'app :
.\scripts\bi_refresh.ps1
```

| Service | URL |
|---------|-----|
| Metabase | http://localhost:3030 |
| Admin BI | http://localhost:4200 → ADMIN → Tableaux de bord BI |

**Dashboards Metabase :** Executive · Managérial · Opérationnel

## Arborescence

```
bi/
├── 01_contexte/          # Bloc 1
├── dw/                   # Bloc 2 — schema.sql
├── bi_etl/               # Bloc 3 — ETL + SCD2 + DQ
├── kpis/                 # Bloc 4 — catalogue + 23 SQL + dq/
├── dashboards/           # Bloc 5 — spec 3 niveaux
├── governance/           # Bloc 6
└── metabase/             # seed + sql/dw/
```

## Présentation & PDF (soutenance)

| Ressource | Chemin |
|-----------|--------|
| **20 slides PFE** | [docs/BI_PRESENTATION_PFE.md](../docs/BI_PRESENTATION_PFE.md) |
| Export PDF Metabase | [presentation/GUIDE_EXPORT_PDF.md](presentation/GUIDE_EXPORT_PDF.md) |
| Script | `.\scripts\export_metabase_pdfs.ps1` |

## Rapport PFE

[docs/BI_PFE.md](../docs/BI_PFE.md)
