# Power BI Find-Me — autre PC (ami / jury)

## Prérequis (une fois)

1. **Docker Desktop** installé et démarré
2. **Power BI Desktop** (Microsoft Store ou site Microsoft)
3. **Git** (ou copie du dossier projet en ZIP/USB)
4. (Optionnel) [MySQL Connector/NET](https://dev.mysql.com/downloads/connector/net/) si Power BI le demande

## Installation du projet

### Option A — Git (recommandé)

```cmd
git clone https://github.com/eyarhit/findMeByEyarhit.git
cd findMeByEyarhit
```

### Option B — Sans Git

Copier tout le dossier `findMeByEyarhit` (clé USB, ZIP, Teams…) sur le PC, par exemple :

`C:\Users\NOM\Desktop\findMeByEyarhit`

## Une commande — dashboard

```cmd
cd C:\Users\NOM\Desktop\findMeByEyarhit
ONE_COMMANDE_POWERBI.cmd
```

Fait automatiquement :

- Démarrage MySQL (Docker)
- ETL Talend → base `findme_dw`
- Génération du dashboard **4 pages** (Executive, Managerial, Opérationnel, Technique)
- Ouverture Power BI `FindMe-Dashboard.pbip`

## Où sont les 4 pages et les dashboards ?

Les pages sont **dans le fichier projet** (`definition/pages/`), mais Power BI Desktop ne les affiche **que si l’option PBIR est activée**.

### Activation obligatoire (1 fois)

1. **Fichier → Options → Fonctionnalités préliminaires**
2. Cocher :
   - **Stocker les rapports au format de métadonnées amélioré (PBIR)**
   - **Option d’enregistrement de projet Power BI (.pbip)**
   - **Modèle sémantique TMDL** (si proposé)
3. **Redémarrer** Power BI Desktop
4. Lancer : `ACTIVER_DASHBOARD_4_PAGES.cmd` (à la racine du projet)

Sans PBIR : vous voyez seulement **Page 1** vide alors que le modèle (tables à droite) est correct.

Après activation, en bas du rapport : **01 - Executive**, **02 - Managerial**, **03 - Operationnel**, **04 - Technique** avec KPI et graphiques.

## Si seule « Page 1 » vide (modèle OK, pas de visuels)

1. **Fermer** Power BI complètement.
2. `GIT_PULL_BI.cmd` (dernière version du rapport).
3. Rouvrir **`bi\powerbi\FindMe-Dashboard\FindMe-Dashboard.pbip`** (double-clic sur le `.pbip`, pas seulement le dossier SemanticModel).
4. **Fichier → Options → Fonctionnalités préliminaires** : activer **Projets Power BI** / **PBIR** / **TMDL** si proposé.
5. En bas : onglets **01 - Executive**, **02 - Managerial**, etc. (pas seulement Page 1).

## Première ouverture Power BI (une fois par PC)

1. Bannière jaune → **Actualiser maintenant**
2. Paramètres source : serveur **`localhost:3306`**, base **`findme_dw`**
3. Onglet **Base de données** (pas Windows)
4. Utilisateur : `findme_bi`
5. Mot de passe : `findme_bi_readonly`
6. Attendre la fin (**18 tables** + mesures `_Mesures BI`)
7. Pages du rapport : **01 Executive** · **02 Managerial** · **03 Operationnel** · **04 Technique** (navigation en haut à droite)

Spécification (mesures, visuels, filtres) : ouvrir dans le navigateur  
`bi\powerbi\guides\findme_4dashboards_full_layout.html`

Si l’écran reste vide :

- **Fichier → Options → Fonctionnalités préliminaires** → activer **TMDL** et **PBIR** (si disponibles)
- Ou utiliser le fichier partagé `bi\powerbi\reports\FindMe_BI_Auto.pbix` (voir ci-dessous)

## Partager le rapport déjà prêt (eyarh → ami)

Sur le PC de **eyarh**, après avoir créé le dashboard :

```cmd
cd findMeByEyarhit
scripts\save-powerbi-seed.cmd
```

Puis envoyer à l’ami **un des deux** :

| Fichier | Comment |
|---------|---------|
| `bi\powerbi\template\FindMe_BI_Seed.pbix` | À mettre dans Git ou ZIP |
| `bi\powerbi\reports\FindMe_BI_Auto.pbix` | Copie directe |

Sur le PC de l’ami : placer le `.pbix` dans  
`findMeByEyarhit\bi\powerbi\reports\FindMe_BI_Auto.pbix`  
puis lancer `ONE_COMMANDE_POWERBI.cmd` → ouverture directe avec visuels.

## Erreurs fréquentes

| Problème | Solution |
|----------|----------|
| `model.bim` manquant | Dans `FindMe-Dashboard.SemanticModel\definition.pbism` : `"version": "4.0"` |
| `version.json` manquant | Fichier requis : `FindMe-Dashboard.Report\definition\version.json` (voir repo ou `git pull`) |
| `layoutOptimization` dans report.json | Retirer cette ligne (schéma PBIR 3.2.0) ; `git pull` ou regénérer le dashboard |
| Volet **Donnees** vide / tous les visuels en erreur | `git pull` puis `ONE_COMMANDE_POWERBI.cmd` (colonnes TMDL) ; **Actualiser** + `findme_bi` / `findme_bi_readonly` |
| Triangles rouges (vue Modele) | Serveur `localhost:3306`, base `findme_dw` ; *Parametres de la source de donnees* → ressaisir `findme_bi` |
| Erreur `ReturnServerDateTime` | `git pull` + `FIX_POWERBI_REFRESH.cmd` (option retiree du modele M) |
| Chemins ambigus dim_date / dim_user | `git pull` + regen : relations user_key sur fact_cv/quiz supprimees |
| Duplicate year_num dans dim_date | Retirer relation year_num ; segment annee sur v_bi_* (pas dim_date) |
| `git pull` bloqué | `GIT_PULL_BI.cmd` (reset dashboard + pull + une commande) |
| Ancienne version (3 pages) | `git pull` puis `ONE_COMMANDE_POWERBI.cmd` |
| Écran vide | Actualiser + identifiants MySQL ; ou utiliser `.pbix` |
| Docker | Lancer **Docker Desktop** avant la commande |

## Test MySQL (hors Power BI)

```cmd
docker compose exec mysql mysql -ufindme_bi -pfindme_bi_readonly -e "SELECT COUNT(*) FROM findme_dw.dim_date;"
```

## Contact projet

Repo : https://github.com/eyarhit/findMeByEyarhit
