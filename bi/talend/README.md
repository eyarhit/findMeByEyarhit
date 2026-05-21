# Bloc 3 — Alimentation DW (Talend ETL)

## Stack PFE (formation BIS)

| Couche | Outil |
|--------|--------|
| Entrepôt | MySQL `findme_dw` (schéma en étoile) |
| **ETL** | **Talend Open Studio** + runtime Docker `talend-etl` |
| **OLAP / restitution** | **Microsoft Power BI** |

Metabase a été retiré — non enseigné dans le module.

## Démarrage

```cmd
docker compose run --rm talend-etl
```

Logs attendus : `Talend ETL (runtime)`, `build ETL : talend-findme-2026`, `ETL terminé avec succès.`

## Fichiers

| Chemin | Rôle |
|--------|------|
| `studio/FindMe_Load_DW/` | Documentation job Talend (composants tMap, connexions) |
| `docker/etl_load_dw.py` | Runtime ETL Docker (équivalent job Talend) |
| `docker/Dockerfile` | Image `talend-etl` |

## Suite

→ Analyse OLAP : [../powerbi/README.md](../powerbi/README.md)
