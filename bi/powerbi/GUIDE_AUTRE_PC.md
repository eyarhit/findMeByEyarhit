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
- Ouverture Power BI (3 pages si `.pbip` OK, sinon `.pbix` si présent)

## Première ouverture Power BI (une fois par PC)

1. Bannière jaune → **Actualiser maintenant**
2. Onglet **Base de données** (pas Windows)
3. Utilisateur : `findme_bi`
4. Mot de passe : `findme_bi_readonly`
5. Attendre la fin du chargement

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
| `git pull` bloqué | `git checkout -- bi/powerbi/` puis `git pull` |
| Écran vide | Actualiser + identifiants MySQL ; ou utiliser `.pbix` |
| Docker | Lancer **Docker Desktop** avant la commande |

## Test MySQL (hors Power BI)

```cmd
docker compose exec mysql mysql -ufindme_bi -pfindme_bi_readonly -e "SELECT COUNT(*) FROM findme_dw.dim_date;"
```

## Contact projet

Repo : https://github.com/eyarhit/findMeByEyarhit
