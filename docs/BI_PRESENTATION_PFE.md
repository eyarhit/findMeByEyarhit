# Présentation PFE — Module BI Find-Me (slides)

> **Usage :** une slide = une section ci-dessous. Copier dans PowerPoint / Canva / Google Slides.  
> **Exports graphiques :** `bi/presentation/exports/*.pdf` ou captures Metabase.

---

## Slide 1 — Titre

**Business Intelligence pour la plateforme Find-Me**  
Pilotage RH Recrutement & Opérations missions  
*Nom · Filière · Année · Encadrant*

---

## Slide 2 — Contexte & problématique

- **Find-Me** : mise en relation candidats ↔ missions ESN (microservices Spring, Angular, MySQL).
- Besoin : **décider** sur le volume de candidatures, la conversion, les compétences marché, l’activité missions.
- Limite des écrans métier : listes opérationnelles, pas de **vision agrégée** ni tendances.

**Question centrale :** Comment offrir une BI fiable, reproductible et alignée sur les données de l’application ?

---

## Slide 3 — Objectifs

| Objectif | Indicateur de réussite |
|----------|------------------------|
| Modèle décisionnel | Entrepôt `findme_dw` schéma en étoile |
| Automatisation | ETL Docker + seed Metabase |
| Pilotage multi-niveaux | 3 dashboards (Executive, Managérial, Opérationnel) |
| Gouvernance | Catalogue 23 KPIs + DQ + RGPD |

---

## Slide 4 — Périmètre (MoSCoW)

**Inclus (Must) :** recrutement, utilisateurs, missions, CV/compétences, quiz & Codingame.  
**Exclu (Won’t) :** turnover SIRH, absentéisme, paie, NPS — *pas de source dans l’OLTP*.

Référence : `bi/01_contexte/moscow.md`

---

## Slide 5 — Utilisateurs cibles

| Persona | Dashboard | Besoin clé |
|---------|-----------|------------|
| Direction | Executive | KPI globaux, tendances |
| DRH / Recruteur | Managérial | Conversion, top missions, compétences |
| Manager ESN | Managérial + Opérationnel | Favoris, statuts, détail |
| ADMIN | Tous + export PDF | Exploitation & démo |

---

## Slide 6 — Architecture globale

```
Microservices → MySQL (OLTP, 5 bases)
       ↓ ETL (bi_etl)
findme_dw (étoile : dimensions + faits)
       ↓ lecture seule (findme_bi)
Metabase :3030 → 3 dashboards
       ↓ manifest JSON
Admin Angular (liens BI)
```

*Schéma détaillé : `bi/dw/schema.md`*

---

## Slide 7 — Modèle en étoile (Kimball)

- **Dimensions :** temps, utilisateur, mission, compétence (+ SCD2 utilisateur pour historique RH).
- **Faits :** candidature, mission, CV, quiz, Codingame, notification…
- **Grain exemple :** 1 ligne `fact_candidature` = 1 postulation.

**Pourquoi l’étoile ?** Requêtes analytiques simples, performance, vocabulaire métier clair pour le jury BI.

---

## Slide 8 — Pipeline ETL

| Étape | Outil |
|-------|------|
| Extract | `user_bd`, `mission_bd`, `cv_bd`, `quiz_bd`, `codingame_bd` |
| Transform | Règles COALESCE, flags statut, clés dates |
| Load | Full refresh `findme_dw` |
| Qualité | `run_dq_checks()` + `etl_run_log` |

Commande : `docker compose run --rm bi-etl`

---

## Slide 9 — SCD Type 2 (valeur ajoutée RH)

- **SCD1** `dim_user` : image courante du profil.
- **SCD2** `dim_user_scd2` : historique des changements rôle / statut / pays.
- Permet d’analyser « qui était candidat à la date T » (perspective audit RH).

---

## Slide 10 — Catalogue KPI (extrait)

| KPI | Formule (résumé) | Seuil type |
|-----|------------------|------------|
| Effectif utilisateurs | SUM(user_count) | Volume |
| Taux conversion | acceptées / candidatures × 100 | Vert ≥ 25 % |
| Candidatures / mois | SUM par dim_date | Tendance |
| Top compétences | dim_skill.usage_count | Marché RH |

**23 KPIs** documentés : `bi/kpis/kpis_catalogue.md`

---

## Slide 11 — Dashboard Executive (capture)

**À insérer :** capture ou PDF `FindMe-BI-Executive.pdf`

**Message à dire :**  
« En un coup d’œil : effectifs, missions, candidatures, CV et évaluations — alimentés par l’entrepôt après chaque cycle ETL. »

---

## Slide 12 — Dashboard Managérial (capture)

**À insérer :** PDF Managérial

**Messages :**
- Pipeline candidatures par statut (ENCOURS / ACCEPTER / REFUSER).
- Top missions sollicitées → priorisation recruteurs.
- Répartition contrats & télétravail → politique offres.

---

## Slide 13 — OLAP & exploration

| Opération | Exemple Find-Me |
|-----------|-----------------|
| Slice | Candidatures ACCEPTER seulement |
| Drill-down | Mois → missions du top 10 |
| Roll-up | Vue `v_bi_kpi_recrutement` par trimestre |

Metabase : filtres dashboard + questions liées.

---

## Slide 14 — Data storytelling

1. **Titre = insight** (« La conversion dépasse 25 % sur Q2 »).
2. **Contexte** : comparer période N vs N-1.
3. **Hiérarchie** : KPI en haut, détails en bas.
4. **3 niveaux** : ne pas montrer 23 graphiques à la direction.

---

## Slide 15 — Gouvernance & qualité

| Pilier | Livrable |
|--------|----------|
| Dictionnaire | `bi/governance/data_dictionary.md` |
| DQ | Règles DQ-C*, DQ-V* + SQL `bi/kpis/sql/dq/` |
| Accès | `findme_bi` SELECT only ; ADMIN Metabase |
| RGPD | Pas d’email en clair dans DW ; agrégats |

RACI : `bi/governance/RACI.md`

---

## Slide 16 — Démo live (2 min)

1. Action dans l’app (candidature ou mission).
2. `docker compose run --rm bi-etl`.
3. Rafraîchir Metabase → graphique mis à jour.
4. Admin Angular → ouvrir dashboard Executive.

---

## Slide 17 — Limites & perspectives

| Limite | Perspective |
|--------|-------------|
| ETL full refresh | ETL incrémental + Airflow |
| Pas de SIRH | Connecteur turnover / absentéisme |
| Export PDF API variable | Pulse / abonnement email alertes |
| Pas d’iframe Metabase | Embedding signé enterprise |

---

## Slide 18 — Bilan & compétences

- Conception **entrepôt décisionnel** et **ETL** sur stack réelle.
- **23 KPIs** RH & opérations documentés (OKR / BSC partiel).
- **3 dashboards** + gouvernance pour soutenance professionnelle.
- Compétences : modélisation dimensionnelle, Metabase, Docker, Python ETL.

---

## Slide 19 — Questions jury (préparation)

- Pourquoi pas requêter l’OLTP directement ? → charge, modèle normalisé, gouvernance.
- Différence étoile vs flocon ? → flocon = dimensions normalisées ; nous : étoile pour simplicité Metabase.
- Comment garantir la fraîcheur ? → `etl_run_log`, ETL avant démo, SLA quotidien cible.
- RGPD ? → compte lecture seule, pas de PII nominative dans `findme_dw`.

---

## Slide 20 — Merci

**Documentation :** `bi/README.md` · **Repo :** Find-Me  
Contact · Dépôt Git · Démo http://localhost:4200 / :3030

---

## Annexe (slides optionnelles)

- Architecture microservices Find-Me (hors BI).
- Exemple requête SQL KPI-05 (`bi/kpis/sql/13_taux_conversion_candidatures.sql`).
- Matrice MoSCoW complète (`bi/01_contexte/moscow.md`).
