# Bloc 3 — Pipeline ETL (`bi_etl`)

## 3.1 Rôle

Charge l’entrepôt **`findme_dw`** depuis les 5 bases OLTP Find-Me (full refresh).

| Étape | Action |
|-------|--------|
| **E**xtract | `SELECT` sur `user_bd`, `mission_bd`, `cv_bd`, `quiz_bd`, `codingame_bd` |
| **T**ransform | Nettoyage NULL, clés dates, flags statut candidature, agrégation skills |
| **L**oad | `TRUNCATE` logique (DELETE) + INSERT dimensions puis faits |

## 3.2 Fichiers

| Fichier | Description |
|---------|-------------|
| `load_star_schema.py` | Script ETL principal |
| `requirements.txt` | `pymysql` |
| `Dockerfile` | Image `bi-etl` |

## 3.3 Sources & règles de transformation

| Source | Cible | Règles clés |
|--------|-------|-------------|
| `users` + `roles` | `dim_user`, `fact_user` | `COALESCE` rôle/statut/pays ; exclure `user_key=0` inconnu |
| `notification` | `fact_notification` | `date_key` depuis `timestamp` |
| `mission` + `descrip_mission` | `dim_mission`, `fact_mission` | Jointure `ville`/`pays` ; `created_at` → `date_key` |
| `candidature` | `fact_candidature` | Flags `is_accepted` / `is_refused` / `is_en_cours` |
| `mission_favoris` | `fact_mission_favori` | Skip si table absente |
| `cv` + `competence` | `fact_cv`, `dim_skill` | `steps_completed` = count `cv_completed_steps` |
| `user_quiz_results` | `fact_quiz` | |
| `evaluation_session` + `result` | `fact_codingame` | Framework via `evaluation_result` |

## 3.4 Fréquence de mise à jour

| Contexte | Fréquence | Commande |
|----------|-----------|----------|
| Démo / soutenance | Avant chaque démo | `docker compose run --rm bi-etl` |
| Développement | Après jeux de test | `.\scripts\bi_refresh.ps1` |
| Production cible | Quotidien 06:00 | Cron + `etl_run_log` |

## 3.5 Variables d’environnement

| Variable | Défaut |
|----------|--------|
| `MYSQL_HOST` | `mysql` |
| `MYSQL_ETL_USER` | `root` |
| `MYSQL_ETL_PASSWORD` | `root` |
| `DW_SCHEMA_SQL` | `/ddl/schema.sql` |

## 3.6 Exécution

```bash
docker compose run --rm bi-etl
```

Logs attendus : `ETL terminé avec succès.`

## 3.7 Livrables Bloc 3

- Dossier `bi/bi_etl/` (ce README + scripts)
- Journal `etl_run_log` dans `findme_dw` (table DDL Bloc 2)

## 3.8 Erreurs courantes

- Lancer Metabase **sans** ETL → graphiques vides.
- Volume MySQL ancien **sans** `findme_dw` → ETL applique `schema.sql` automatiquement.
- Services OLTP pas démarrés → tables vides (normal sur install neuve).

## 3.9 Ancien chemin

Le dossier `bi/etl/` est conservé pour compatibilité ; **référence officielle : `bi/bi_etl/`**.
