# Bloc 4 — KPIs & requêtes analytiques ✅

| Livrable | Fichier |
|----------|---------|
| Catalogue 23 KPIs | [kpis_catalogue.md](kpis_catalogue.md) |
| Requêtes Metabase | [sql/*.sql](sql/) |
| Contrôles qualité | [sql/dq/](sql/dq/) |

## Index fichier → KPI

| Fichier SQL | KPI ID |
|-------------|--------|
| `01_utilisateurs_par_role.sql` | KPI-02 |
| `05_kpi_executif.sql` | KPI-23 |
| `12_candidatures_par_mois.sql` | KPI-04 |
| `13_taux_conversion_candidatures.sql` | KPI-05 |
| `17_top_competences.sql` | KPI-15 |

Voir [kpis_catalogue.md](kpis_catalogue.md) pour la liste complète.

## Utilisation Metabase

1. Connexion `findme_dw`
2. Nouvelle question → SQL natif → coller depuis `sql/`
3. Ajouter au dashboard du niveau adapté (Executive / Managérial / Opérationnel)

## Erreurs courantes

- Calculer un **taux** avec `SUM` sur des taux stockés (utiliser numérateur/dénominateur).
- Oublier le filtre `date_key > 19000101` pour exclure les dates inconnues.
