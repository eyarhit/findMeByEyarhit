# Bloc 2 — Modélisation dimensionnelle ✅

| Livrable | Fichier |
|----------|---------|
| DDL source de vérité | [schema.sql](schema.sql) |
| Documentation | [schema.md](schema.md) |
| Diagramme | [schema.md](schema.md#21-diagramme-logique) |

## Contenu du schéma

- **4 dimensions** : `dim_date`, `dim_user`, `dim_mission`, `dim_skill`
- **SCD2** : `dim_user_scd2`
- **8 faits** + `etl_run_log`
- **3 vues** : `v_bi_candidature`, `v_bi_mission`, `v_bi_kpi_recrutement`

## Application

```bash
docker compose run --rm bi-etl
```

## Erreurs courantes

- Modifier uniquement `docker/mysql-init/05-*` sans mettre à jour `schema.sql`.
- Requêtes Metabase sur OLTP au lieu de `findme_dw`.
