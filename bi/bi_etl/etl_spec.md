# Bloc 3 — Spécification ETL (complète)

## Pipeline

| Phase | Script | Durée typique |
|-------|--------|---------------|
| Extract | `load_star_schema.py` | 5–30 s |
| Transform | fonctions `load_*` | inclus |
| Load | INSERT / UPDATE `findme_dw` | inclus |
| Qualité | `run_dq_checks()` | &lt; 1 s |

## Règles de transformation détaillées

### dim_date

| Règle | Détail |
|-------|--------|
| ETL-D01 | Génère 2020-01-01 → 2035-12-31 si vide |
| ETL-D02 | Clé inconnue `19000101` pour dates NULL |

### dim_user (SCD1) + fact_user

| Règle | Détail |
|-------|--------|
| ETL-U01 | `DELETE` fact_user + dim_user (sauf clé 0) puis rechargement |
| ETL-U02 | `role` NULL → `INCONNU` |
| ETL-U03 | `country` vide → `Non renseigné` |
| ETL-U04 | 1 ligne `fact_user` par utilisateur (`user_count=1`) |

### dim_user_scd2 (SCD2)

| Règle | Détail |
|-------|--------|
| ETL-S01 | **Pas de TRUNCATE** — historique conservé entre runs |
| ETL-S02 | Si (rôle, statut, pays) change → fermer version (`valid_to=today`, `is_current=0`) |
| ETL-S03 | Insérer nouvelle version `valid_from=today`, `is_current=1` |

### dim_mission + fact_mission

| Règle | Détail |
|-------|--------|
| ETL-M01 | Jointure `descrip_mission`, `ville`, `pays` |
| ETL-M02 | `is_remote` booléen 0/1 |
| ETL-M03 | `created_at` → `date_key` mission |

### fact_candidature

| Règle | Détail |
|-------|--------|
| ETL-C01 | `ACCEPTER` → `is_accepted=1` |
| ETL-C02 | `REFUSER` → `is_refused=1` |
| ETL-C03 | `ENCOURS` → `is_en_cours=1` |
| ETL-C04 | `date_postulation` → `date_key` |

### dim_skill

| Règle | Détail |
|-------|--------|
| ETL-K01 | UNION langages, frameworks, DB, outils |
| ETL-K02 | `usage_count` = nombre de liens `cv_competence` |

## Fréquences

| Mode | Commande |
|------|----------|
| Docker compose | Service `bi-etl` au `up` |
| Manuel | `docker compose run --rm bi-etl` |
| Script | `.\scripts\bi_refresh.ps1` |

## Livrables Bloc 3 ✅

- [x] `load_star_schema.py`
- [x] `etl_spec.md`
- [x] `README.md`
- [x] `Dockerfile` + `requirements.txt`
- [x] Journal `etl_run_log`
- [x] Contrôles DQ intégrés

## Erreurs courantes

- Oublier de démarrer les microservices avant ETL (tables vides).
- Confondre `bi/etl/` (obsolète) et `bi/bi_etl/` (officiel).
