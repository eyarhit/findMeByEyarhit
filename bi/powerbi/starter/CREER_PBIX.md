# Creer FindMe_BI_Auto.pbix (5 minutes, une seule fois)

Le format **.pbix** est le plus simple pour Power BI Desktop. Apres cette etape, `scripts\powerbi-open.cmd` ouvrira ce fichier automatiquement.

## Etape 1 — Lancer la connexion

Double-cliquez sur **`findme_dw.pbids`** (dans ce dossier `starter`).

Ou apres `scripts\powerbi-open.cmd` si vous n'avez pas encore de `.pbix`.

## Etape 2 — Identifiants MySQL

- Onglet **Base de donnees** (pas Windows)
- Utilisateur : `findme_bi`
- Mot de passe : `findme_bi_readonly`

## Etape 3 — Navigateur : cocher les tables

Cochez au minimum :

- `dim_date`, `dim_user`, `dim_mission`, `dim_skill`
- `fact_candidature`, `fact_mission`, `fact_cv`, `fact_user`, `fact_notification`
- `v_bi_candidature`, `v_bi_mission`, `v_bi_kpi_recrutement`

Puis **Charger** (ou **Transformer** puis **Fermer et appliquer**).

## Etape 4 — Enregistrer le .pbix

**Fichier → Enregistrer sous** :

```
bi\powerbi\reports\FindMe_BI_Auto.pbix
```

(chemin complet : `...\findMeByEyarhit\bi\powerbi\reports\FindMe_BI_Auto.pbix`)

## Etape 5 — Relancer

```cmd
scripts\powerbi-open.cmd
```

Power BI ouvre directement votre `.pbix` avec toutes les tables.

## Visuels (exemple rapide)

- Carte : `v_bi_kpi_recrutement` → champ KPI dans **Valeurs**
- Tableau : `v_bi_candidature` → champs dans **Colonnes**
