# Bloc 4 — Analyse OLAP (Microsoft Power BI)

## Alignement cours BIS

| Notion cours | Implémentation Power BI |
|--------------|-------------------------|
| **Modélisation multidimensionnelle** | Schéma en étoile `findme_dw` (fait + dimensions) |
| **Mesures** | Champs numériques agrégés (SUM, COUNT, % conversion) |
| **Dimensions / hiérarchies** | `dim_date` (jour → mois → année), `dim_mission`, `dim_user` |
| **OLAP** | Drill-down, filtres croisés, segments dans Power BI Desktop |
| **Source** | MySQL `findme_dw` (alimenté par **Talend** avant ouverture des rapports) |

## Prérequis

1. **ETL Talend** exécuté :

```cmd
docker compose run --rm talend-etl
```

2. **Power BI Desktop** (Windows) installé — [téléchargement Microsoft](https://www.microsoft.com/power-platform/products/power-bi/desktop).

3. MySQL accessible sur `localhost:3306` (Docker `findme-mysql` — le port **3306** doit être publié dans `docker-compose.yml`).

## Connexion Power BI → findme_dw

1. Power BI Desktop → **Obtenir des données** → **Base de données MySQL**.
2. Serveur : `localhost:3306`, base : `findme_dw`.
3. Mode : **Import** (PFE / volume modéré).
4. Utilisateur : `findme_bi` / mot de passe : `findme_bi_readonly`.

Tables à charger (étoile) :

- Dimensions : `dim_date`, `dim_user`, `dim_mission`, `dim_skill`
- Faits : `fact_candidature`, `fact_mission`, `fact_cv`, `fact_user`, `fact_notification`, `fact_quiz`, `fact_codingame`, `fact_mission_favori`
- Vues : `v_bi_candidature`, `v_bi_mission`, `v_bi_kpi_recrutement`

## Modèle sémantique (niveau logique)

Relations Power BI (1-N) :

- `dim_date[date_key]` → `fact_candidature[date_key]`
- `dim_mission[mission_key]` → `fact_candidature[mission_key]`
- `dim_user[user_key]` → `fact_cv[user_key]`

Mesures DAX exemple :

```dax
Total Candidatures = SUM(fact_candidature[candidature_count])
Taux Acceptation % =
  DIVIDE(SUM(fact_candidature[is_accepted]), SUM(fact_candidature[candidature_count]), 0) * 100
```

Requêtes SQL de référence : `bi/kpis/sql/*.sql`

## Trois rapports (.pbix) — 3 niveaux décisionnels

Créer et enregistrer dans `bi/powerbi/reports/` :

| Fichier | Niveau | Visuels suggérés |
|---------|--------|------------------|
| `FindMe_BI_Executive.pbix` | Executive | KPI cards, tendances candidatures/missions |
| `FindMe_BI_Managerial.pbix` | Managérial | Barres par statut, top missions, compétences |
| `FindMe_BI_Operational.pbix` | Opérationnel | Notifications, étapes CV, Codingame |

> Les fichiers `.pbix` sont créés dans Power BI Desktop (binaire). Le repo contient le **guide** et les **requêtes SQL** ; copier les `.pbix` dans `reports/` après création pour le jury.

## Docker et Power BI

- **Talend ETL** : conteneur Linux `talend-etl` ✅
- **MySQL DW** : conteneur `findme-mysql` ✅
- **Power BI Desktop** : sur la machine hôte Windows (hors conteneur) — pratique standard en formation.

Power BI Report Server en Docker nécessite des conteneurs Windows ; non requis pour la soutenance si les `.pbix` sont ouverts en local.

## Démo jury (5 min)

1. Montrer job Talend (`bi/talend/studio`) + log `ETL terminé avec succès`.
2. Ouvrir Power BI → rapport Executive → drill sur mois / statut.
3. Admin Angular → page BI (liens vers rapports + paramètres connexion).
