# Bloc 6b — Règles qualité des données

## Dimensions DQ

### Complétude

| Règle ID | Table | Condition | Sévérité |
|----------|-------|-----------|----------|
| DQ-C01 | dim_mission | `mission_name` non vide si mission publiée | Warning |
| DQ-C02 | fact_candidature | `candidat_user_id` NOT NULL | Error |
| DQ-C03 | dim_user | 100 % `user_id` renseigné | Error |

**Requête contrôle :**
```sql
SELECT COUNT(*) AS missions_sans_nom
FROM dim_mission WHERE TRIM(mission_name) = '';
```

### Cohérence

| Règle ID | Condition |
|----------|-----------|
| DQ-K01 | `is_accepted + is_refused + is_en_cours` ≤ `candidature_count` par ligne |
| DQ-K02 | `date_key` existe dans `dim_date` |
| DQ-K03 | `mission_key` existe dans `dim_mission` pour chaque fait candidature |

### Unicité

| Règle ID | Table | Clé |
|----------|-------|-----|
| DQ-U01 | dim_user | `user_id` |
| DQ-U02 | dim_mission | `mission_id` |

### Validité

| Règle ID | Domaine autorisé |
|----------|------------------|
| DQ-V01 | `statut_candidature` ∈ ENCOURS, ACCEPTER, REFUSER |
| DQ-V02 | `role_name` ∈ enum ERole Java |

### Fraîcheur

| Règle ID | Condition |
|----------|-----------|
| DQ-F01 | Dernier `etl_run_log.status = SUCCESS` &lt; 48 h |

```sql
SELECT * FROM etl_run_log ORDER BY run_id DESC LIMIT 1;
```

## Processus incident

1. Détecter (Metabase alerte ou ETL FAILED)
2. Corriger source OLTP ou ETL
3. Relancer `docker compose run --rm bi-etl`
4. Documenter dans registre incidents (rapport PFE)

## Livrables

- Ce document + requêtes de contrôle dans Metabase (collection « DQ Find-Me »)

## Erreurs courantes

- Contrôler qualité **après** présentation sans ETL récent.
- Ignorer lignes `date_key = 19000101` (à mentionner en note de bas de page).
