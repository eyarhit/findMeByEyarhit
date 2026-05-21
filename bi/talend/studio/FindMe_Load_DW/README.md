# Job Talend — `FindMe_Load_DW` (alimentation findme_dw)

> **Outil formation :** Talend Open Studio for Data Integration (8.x)  
> **Alignement cours :** Extraction → Nettoyage / Transformation → Chargement (ETL) vers entrepôt décisionnel.

## 1. Connexions Talend (metadata)

| Nom Talend | Type | Paramètres Docker |
|------------|------|-------------------|
| `SRC_MySQL_OLTP` | MySQL | Host `mysql`, port `3306`, user `root`, bases `user_bd`, `mission_bd`, `cv_bd`, `quiz_bd`, `codingame_bd` |
| `DST_MySQL_DW` | MySQL | Base `findme_dw` |

## 2. Architecture du job (sous-jobs)

```
FindMe_Load_DW
├── tPrejob          → log etl_run_log RUNNING
├── tMysqlRow        → DDL findme_dw (si besoin)
├── SubJob_Dim_Date
├── SubJob_Dim_User      (SCD1 + fact_user)
├── SubJob_Dim_User_SCD2
├── SubJob_Dim_Mission
├── SubJob_Dim_Skill
├── SubJob_Fact_Notification
├── SubJob_Fact_Candidature
├── SubJob_Fact_Favori
├── SubJob_Fact_CV
├── SubJob_Fact_Quiz
├── SubJob_Fact_Codingame
├── tPostjob         → DQ checks + etl_run_log SUCCESS
```

## 3. Correspondance composants Talend ↔ cours

| Phase cours | Composant Talend | Exemple Find-Me |
|-------------|------------------|-----------------|
| **Extraction** | `tMysqlInput` | `SELECT` sur `user_bd.users` |
| **Nettoyage** | `tFilterRow`, `tMap` (rejet NULL) | Filtrer `user_id` NULL |
| **Transformation** | `tMap` | `COALESCE(role,'INCONNU')`, flags statut candidature |
| **Chargement** | `tMysqlOutput` (Insert/Update) | `dim_user`, `fact_candidature` |
| **Métadonnées** | Repository Talend | Connexions versionnées |

## 4. Extraction (Exemple `SubJob_Dim_User`)

- **Extraction complète** (full refresh) : rechargement à chaque run PFE.
- Source : requête SQL jointure `users` + `roles` (voir `bi/bi_etl/etl_spec.md`).

## 5. Runtime Docker (reproductibilité jury)

Le job est **conçu dans Talend Open Studio** ; l’exécution automatisée pour `docker compose` utilise le runtime documenté :

```cmd
docker compose run --rm talend-etl
```

Fichier : `bi/talend/docker/etl_load_dw.py` (même logique E/T/L que le job graphique).

## 6. Captures pour le rapport PFE

À insérer depuis Talend Studio :

1. Vue graphique du job `FindMe_Load_DW`
2. `tMap` utilisateur (schéma entrée / sortie)
3. Console d’exécution + `etl_run_log` MySQL
