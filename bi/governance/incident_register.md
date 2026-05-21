# Registre incidents qualité données (Bloc 6)

| ID | Date | Description | Gravité | Cause | Action | Statut |
|----|------|-------------|---------|-------|--------|--------|
| INC-001 | | Exemple : graphique candidatures vide | Moyenne | ETL non relancé | `docker compose run --rm bi-etl` | Ouvert |

## Procédure

1. Détecter (DQ SQL, utilisateur, Metabase erreur)
2. Qualifier gravité (Critique / Moyenne / Faible)
3. Corriger source ou ETL
4. Relancer ETL + vérifier `etl_run_log`
5. Clôturer avec date et responsable

## Requêtes de diagnostic

```sql
SELECT * FROM findme_dw.etl_run_log ORDER BY run_id DESC LIMIT 5;
```

Fichiers DQ : `bi/kpis/sql/dq/`
