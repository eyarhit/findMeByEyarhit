# BI Find-Me — Talend + Power BI

## URLs

| Service | URL |
|---------|-----|
| Application | http://localhost:4200 |
| Guide Power BI | http://localhost:8088 |
| MySQL (Power BI Desktop) | `localhost:3306` → base `findme_dw` |

## Comptes

| Usage | User | Password |
|-------|------|----------|
| Power BI / lecture | `findme_bi` | `findme_bi_readonly` |
| ETL (Docker) | `root` | `root` |

## Commandes

```cmd
docker compose run --rm talend-etl
docker compose run --rm powerbi-seed
```

Documentation complète : [docs/PROJET_BI_ESB.md](docs/PROJET_BI_ESB.md)
