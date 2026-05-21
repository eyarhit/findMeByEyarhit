# Bloc 4 — Catalogue KPIs RH & Opérations (Find-Me)

Base analytique : **`findme_dw`** uniquement. Requêtes SQL : `bi/kpis/sql/` (sources des visuels Power BI).

## Légende seuils (exemple PFE)

| Couleur | Règle type |
|---------|------------|
| Vert | Objectif atteint |
| Orange | Écart modéré |
| Rouge | Action requise |

---

## KPI-01 — Effectif utilisateurs

| Attribut | Valeur |
|----------|--------|
| **Définition** | Nombre de comptes enregistrés |
| **Formule** | `SUM(user_count)` sur `fact_user` |
| **SQL** | `05_kpi_executif.sql` (colonne `total_utilisateurs`) |
| **Dimensions** | rôle, statut, pays (`dim_user`) |
| **Fréquence** | Après chaque ETL |
| **Seuils** | N/A (indicateur volume) |
| **MoSCoW** | Must |
| **Owner** | ADMIN |

## KPI-02 — Candidats actifs

| Attribut | Valeur |
|----------|--------|
| **Formule** | `SUM(user_count)` WHERE `role_name = 'CANDIDAT'` |
| **SQL** | `01_utilisateurs_par_role.sql`, KPI exécutif |
| **Seuils** | Croissance &gt; 10 % / mois → vert |
| **MoSCoW** | Must |

## KPI-03 — Recruteurs ESN

| Attribut | Valeur |
|----------|--------|
| **Formule** | Comptes rôles ESN_ADMIN, ESN_COMMARCIAL, CHARGEDERECRUTEMENT, INTERCONTRAT |
| **SQL** | `05_kpi_executif.sql` |
| **MoSCoW** | Must |

## KPI-04 — Volume candidatures

| Attribut | Valeur |
|----------|--------|
| **Définition** | Nombre total de postulations |
| **Formule** | `SUM(candidature_count)` |
| **SQL** | `12_candidatures_par_mois.sql`, `08_candidatures_par_statut.sql` |
| **Dimensions** | mois, mission, statut |
| **Seuils** | Rouge si 0 sur 30 jours avec missions OPEN |
| **MoSCoW** | Must |

## KPI-05 — Taux de conversion acceptation

| Attribut | Valeur |
|----------|--------|
| **Définition** | Part des candidatures acceptées (RH : succès recrutement) |
| **Formule** | `100 × SUM(is_accepted) / NULLIF(SUM(candidature_count), 0)` |
| **SQL** | `13_taux_conversion_candidatures.sql`, vue `v_bi_kpi_recrutement` |
| **Seuils** | Vert ≥ 25 %, Orange 10–25 %, Rouge &lt; 10 % |
| **MoSCoW** | Must |
| **OLAP** | Slice par `type_contrat`, Drill par `mission_name` |

## KPI-06 — Taux de refus

| Attribut | Valeur |
|----------|--------|
| **Formule** | `100 × SUM(is_refused) / SUM(candidature_count)` |
| **SQL** | `13_taux_conversion_candidatures.sql` |
| **MoSCoW** | Should |

## KPI-07 — Candidatures en cours

| Attribut | Valeur |
|----------|--------|
| **Formule** | `SUM(is_en_cours)` |
| **SQL** | `08_candidatures_par_statut.sql` |
| **Usage op.** | Backlog RH à traiter |
| **MoSCoW** | Must |

## KPI-08 — Missions publiées

| Attribut | Valeur |
|----------|--------|
| **Formule** | `SUM(mission_count)` |
| **SQL** | `06_missions_par_statut.sql`, `07_missions_par_mois.sql` |
| **MoSCoW** | Must |

## KPI-09 — Top missions (attraction)

| Attribut | Valeur |
|----------|--------|
| **Définition** | Missions avec le plus de candidatures |
| **SQL** | `14_top_missions_candidatures.sql` |
| **MoSCoW** | Should |

## KPI-10 — Répartition type de contrat

| Attribut | Valeur |
|----------|--------|
| **SQL** | `09_type_contrat.sql` |
| **Visualisation** | Barres |
| **MoSCoW** | Should |

## KPI-11 — Télétravail vs sur site

| Attribut | Valeur |
|----------|--------|
| **SQL** | `15_missions_teletravail.sql` |
| **MoSCoW** | Could |

## KPI-12 — Top villes missions

| Attribut | Valeur |
|----------|--------|
| **SQL** | `10_top_villes.sql` |
| **MoSCoW** | Could |

## KPI-13 — Favoris par type utilisateur

| Attribut | Valeur |
|----------|--------|
| **SQL** | `11_favoris_par_user_type.sql` |
| **MoSCoW** | Could |

## KPI-14 — CV créés par mois

| Attribut | Valeur |
|----------|--------|
| **Formule** | `SUM(cv_count)` par mois |
| **SQL** | `16_cv_par_mois.sql` |
| **MoSCoW** | Must |

## KPI-15 — Top compétences marché

| Attribut | Valeur |
|----------|--------|
| **SQL** | `17_top_competences.sql` |
| **Usage RH** | Adapter offres aux stacks dominantes |
| **MoSCoW** | Must |

## KPI-16 — Complétion formulaire CV

| Attribut | Valeur |
|----------|--------|
| **SQL** | `18_cv_etapes_completees.sql` |
| **Seuils** | Vert si &gt; 60 % CV en tranche « 4-6 étapes » |
| **MoSCoW** | Should |

## KPI-17 — Taux réussite quiz

| Attribut | Valeur |
|----------|--------|
| **Formule** | `SUM(passed=1) / SUM(attempt_count)` |
| **SQL** | `19_quiz_reussite.sql`, `20_score_moyen_quiz.sql` |
| **Seuils** | Vert ≥ 70 %, Rouge &lt; 50 % |
| **MoSCoW** | Must |

## KPI-18 — Score moyen quiz

| Attribut | Valeur |
|----------|--------|
| **SQL** | `20_score_moyen_quiz.sql` |
| **MoSCoW** | Should |

## KPI-19 — Sessions Codingame / mois

| Attribut | Valeur |
|----------|--------|
| **SQL** | `21_codingame_sessions_mois.sql` |
| **MoSCoW** | Should |

## KPI-20 — Score moyen Codingame

| Attribut | Valeur |
|----------|--------|
| **SQL** | `22_codingame_score_moyen.sql` |
| **MoSCoW** | Should |

## KPI-21 — Score par framework

| Attribut | Valeur |
|----------|--------|
| **SQL** | `23_codingame_par_framework.sql` |
| **MoSCoW** | Should |

## KPI-22 — Notifications (engagement)

| Attribut | Valeur |
|----------|--------|
| **SQL** | `04_notifications_par_mois.sql` |
| **MoSCoW** | Could |

## KPI-23 — Vue exécutive consolidée

| Attribut | Valeur |
|----------|--------|
| **SQL** | `05_kpi_executif.sql` |
| **Dashboard** | Niveau Executive |
| **MoSCoW** | Must |

---

## KPIs RH classiques — hors périmètre (référence rapport)

| KPI | Raison Won't |
|-----|--------------|
| Turnover | Pas de données départ SIRH |
| Absentéisme | Pas de pointeuse |
| Coût par embauche | Pas de coûts dans OLTP |
| Délai moyen recrutement | Partiel : pas `date_embauche` ; proxy = candidatures/mois |
| NPS employé | Pas d’enquête |

---

## Livrables Bloc 4

- Ce catalogue
- 23 fichiers `bi/kpis/sql/*.sql`

## Erreurs courantes

- Comparer des KPIs de **bases OLTP différentes** au lieu de `findme_dw`.
- Oublier de **relancer l’ETL** avant de juger un KPI « faux ».
