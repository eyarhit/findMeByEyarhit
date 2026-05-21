# Créer les 4 dashboards dans Power BI (méthode fiable)

Si vous voyez **Page 1** vide ou l’erreur `visualContainers`, le modèle est OK mais le rapport auto-généré n’est pas compatible avec votre version de Desktop. Suivez cette méthode (15–30 min) : **même données, même mesures, pages visibles**.

## 1. Préparer

```cmd
GIT_PULL_BI.cmd
```

Dans Power BI : **Actualiser** → `findme_bi` / `findme_bi_readonly`.

## 2. Supprimer la page fantôme

- En bas : clic droit sur **Page 1** → **Supprimer**
- Si l’erreur revient, fermer Power BI, relancer `GIT_PULL_BI.cmd`

## 3. Créer 4 pages (clic droit sur + en bas)

| Onglet | Nom |
|--------|-----|
| 1 | 01 - Executive |
| 2 | 02 - Managerial |
| 3 | 03 - Operationnel |
| 4 | 04 - Technique |

## 4. Page 01 - Executive

**Cartes** (visuel **Carte**, champs depuis **MesuresBI**) :

- KPI Candidatures
- KPI Acceptees
- KPI Taux %
- Missions (vue)
- Missions ouvertes

**Graphiques** (table **v_bi_kpi_recrutement**) :

- Courbe : axe X `month_num`, axe Y `candidatures`
- Colonnes : axe X `month_num`, valeurs `acceptees` + `refusees`

**Segment** : `v_bi_kpi_recrutement[year_num]`

## 5. Page 02 - Managerial

**Cartes** : Candidatures (vue), Acceptees (vue), Refusees (vue), En cours (vue), Missions (vue)

**Visuels** :

- Anneau : `v_bi_candidature[statut_candidature]` + Mesure **Candidatures (vue)**
- Barres : `v_bi_mission[type_contrat]` + **Missions (vue)**
- Tableau : mission_name, statut, ville, candidature_count

**Segments** : `v_bi_candidature[year_num]`, `v_bi_mission[ville]`

## 6. Page 03 - Operationnel

**Cartes** : Total utilisateurs, Total notifications, Taux lecture %, Total CV, Total favoris

**Visuels** :

- Barres : `dim_skill[skill_label]` + `usage_count`
- Anneau : `dim_user[role_name]` + **Total utilisateurs**
- Courbe : `dim_date[full_date]` + `fact_cv[cv_count]`

## 7. Page 04 - Technique

**Cartes** : Tentatives quiz, Score moyen quiz, Sessions codingame, **Runs ETL OK** (pas la date — statut Talend = SUCCESS)

**Visuels** :

- Barres : `fact_codingame[framework_name]` + score moyen
- Table : `etl_run_log` (started_at, status, rows_loaded)

## 8. Enregistrer pour l’équipe

**Fichier → Enregistrer sous** :

`bi\powerbi\reports\FindMe_BI_Auto.pbix`

Puis les amis lancent :

```cmd
ONE_COMMANDE_POWERBI.cmd -UsePbix
```

## Mesures

Toutes sont dans la table **MesuresBI** (volet Données). Détail DAX : `POWERBI_TABLES_ET_MESURES.md`.
