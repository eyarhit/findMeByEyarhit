# Personas utilisateurs BI (Bloc 1)

## P1 — Amina, DRH / Responsable recrutement

| | |
|---|---|
| **Objectif** | Réduire le délai de traitement des candidatures et prioriser les missions critiques |
| **Fréquence** | Hebdomadaire (+ pic avant comité) |
| **Dashboard** | Managérial |
| **Questions** | Conversion ? Missions les plus demandées ? Compétences à rechercher ? |
| **Contrainte** | Pas le temps pour SQL ; filtres simples (mois, statut) |

## P2 — Karim, Manager ESN / Commercial

| | |
|---|---|
| **Objectif** | Voir quelles offres performent (favoris, candidatures, télétravail) |
| **Fréquence** | Quotidienne en période de staffing |
| **Dashboard** | Managérial + Opérationnel |
| **Questions** | Top missions ? Type contrat dominant ? Favoris par type user ? |

## P3 — Direction / ADMIN plateforme

| | |
|---|---|
| **Objectif** | Vision synthèse : croissance users, volume missions/candidatures, santé évaluations |
| **Fréquence** | Mensuelle |
| **Dashboard** | Executive |
| **Questions** | KPI globaux ? Tendances 12 mois ? |
| **Format** | PDF Metabase pour comité |

## P4 — Ops / Technique (hors persona métier)

| | |
|---|---|
| **Objectif** | ETL OK, fraîcheur données, Metabase up |
| **Outils** | `etl_run_log`, logs Docker, `bi_refresh.ps1` |

## P5 — Candidat (exclu BI)

Aucun accès Metabase ni `findme_dw`.
