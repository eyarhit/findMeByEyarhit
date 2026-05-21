# Bloc 5 — Dashboards ✅

| Livrable | Fichier |
|----------|---------|
| Spécification 3 niveaux | [dashboards_spec.md](dashboards_spec.md) |
| Implémentation Metabase | `bi/metabase/seed_metabase.py` → 3 dashboards |
| UI Admin | `find-me-front-2.1/.../bi-dashboard` |

## Dashboards Metabase créés par le seed

| Niveau | Nom |
|--------|-----|
| Executive | Find-Me — BI Executive |
| Managérial | Find-Me — BI Managérial |
| Opérationnel | Find-Me — BI Opérationnel |

## Reset dashboards

```bash
docker volume rm findmebyeyarhit_metabase_data
docker compose up -d --build metabase metabase-seed
```

## Erreurs courantes

- Manifest vide → relancer `metabase-seed` après `bi-etl`.
- Un seul dashboard pour tous les profils → utiliser les 3 niveaux.
