# Bloc 6a — Dictionnaire de données (`findme_dw`)

| Champ / KPI | Table | Type | Description métier | Source OLTP | Règle | Owner |
|-------------|-------|------|------------------|-------------|-------|-------|
| `date_key` | dim_date | INT | Identifiant jour YYYYMMDD | Généré ETL | 19000101 si inconnu | BI |
| `role_name` | dim_user | VARCHAR | Rôle Find-Me (CANDIDAT, ESN_*, ADMIN…) | users.role_id → roles | COALESCE INCONNU | DRH |
| `status_name` | dim_user | VARCHAR | PENDING, ACTIVE, INACTIVE | users.status | Enum string | DRH |
| `candidature_count` | fact_candidature | INT | Toujours 1 par grain | candidature | Mesure additive | Recrutement |
| `is_accepted` | fact_candidature | TINYINT | 1 si statut ACCEPTER | statut_candidature | Dérivé ETL | Recrutement |
| `mission_count` | fact_mission | INT | 1 par mission | mission | Additive | Ops |
| `usage_count` | dim_skill | INT | Nb CV liés à la compétence | cv_competence | Agrégé ETL | RH compétences |
| `passed` | fact_quiz | TINYINT | Réussite quiz onboarding | user_quiz_results | Bool | Formation |
| `total_score` | fact_codingame | DOUBLE | Score session | evaluation_session | Nullable | Technique |
| KPI-05 taux acceptation | — | % | Succès recrutement | fact_candidature | Voir kpis_catalogue | DRH |

## Mesures additives vs non additives

| Additives (SUM OK) | Non additives (ratio en requête) |
|--------------------|----------------------------------|
| candidature_count, mission_count, cv_count | Taux conversion, taux réussite quiz |
| notification_count, user_count | Score moyen (AVG) |

## Fraîcheur

| Attribut | Valeur |
|----------|--------|
| Source | `etl_run_log.finished_at` |
| SLA démo | Manuel avant soutenance |
| SLA cible | &lt; 24 h (ETL quotidien) |

---

## Tables — inventaire complet

### dim_date

| Colonne | Type | Description |
|---------|------|-------------|
| date_key | INT PK | YYYYMMDD |
| full_date | DATE | Date calendaire |
| year_num, month_num, quarter_num | | Hiérarchie temps |
| month_name | VARCHAR | Libellé mois |
| day_of_week, week_of_year | | ISO |
| is_weekend | TINYINT | 1 = samedi/dimanche |

### dim_user (SCD1)

| Colonne | Type | Description |
|---------|------|-------------|
| user_key | INT PK | Surrogate |
| user_id | BIGINT UK | ID OLTP |
| role_name | VARCHAR | Rôle métier |
| status_name | VARCHAR | Statut compte |
| country, sexe | VARCHAR | Profil |

### dim_user_scd2 (SCD2)

| Colonne | Type | Description |
|---------|------|-------------|
| user_scd_key | INT PK | Version |
| valid_from, valid_to | DATE | Période validité |
| is_current | TINYINT | 1 = version active |

### dim_mission

| Colonne | Type | Description |
|---------|------|-------------|
| mission_key | INT PK | |
| mission_id | BIGINT UK | |
| status_mission | VARCHAR | OPEN, CLOSED… |
| type_contrat | VARCHAR | CDI, CDD… |
| is_remote | TINYINT | Télétravail |
| ville, pays | VARCHAR | Localisation |
| mission_name, reference_code | VARCHAR | Libellés |

### dim_skill

| Colonne | Type | Description |
|---------|------|-------------|
| skill_key | INT PK | |
| skill_label | VARCHAR | Compétence |
| skill_category | VARCHAR | Langage, Framework… |
| usage_count | INT | Fréquence CV |

### Tables de faits

Voir [../dw/schema.md](../dw/schema.md) pour grains et FK de chaque `fact_*`.

### etl_run_log

| Colonne | Description |
|---------|-------------|
| run_id | Identifiant exécution |
| started_at / finished_at | Fenêtre ETL |
| status | RUNNING, SUCCESS, FAILED |
| rows_loaded | Volume chargé |
| error_message | Détail échec |
