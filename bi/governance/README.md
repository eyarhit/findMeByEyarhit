# Bloc 6 — Gouvernance & qualité ✅

| Livrable | Fichier |
|----------|---------|
| Dictionnaire de données | [data_dictionary.md](data_dictionary.md) |
| Règles qualité | [data_quality_rules.md](data_quality_rules.md) |
| RGPD & accès | [rgpd_access.md](rgpd_access.md) |
| RACI | [RACI.md](RACI.md) |
| Registre incidents | [incident_register.md](incident_register.md) |

## Contrôles automatisés

- Fin de chaque ETL : `run_dq_checks()` dans `bi_etl/load_star_schema.py`
- Requêtes manuelles : `bi/kpis/sql/dq/`

## Erreurs courantes

- Données de test réelles avec email en clair dans exports PDF.
- Partager compte admin Metabase en démo publique sans changer le mot de passe.
