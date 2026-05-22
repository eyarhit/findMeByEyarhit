# Guide — faire tester un ami après `git pull`

Ce guide est pour **eyarh** et ses amis qui récupèrent le dépôt après un push sur `main`.

Dépôt : https://github.com/eyarhit/findMeByEyarhit

---

## 1. Prérequis (une fois par machine)

| Outil | Version / note |
|--------|----------------|
| **Git** | clone + pull |
| **Docker Desktop** | MySQL + ETL + Hub BI |
| **Power BI Desktop** | Options → **PBIR** + **projet .pbip** activés |
| **Node.js** (optionnel) | uniquement pour l’app Angular en local |

---

## 2. Récupérer le code (ami)

```cmd
git clone https://github.com/eyarhit/findMeByEyarhit.git
cd findMeByEyarhit
```

À chaque mise à jour :

```cmd
cd findMeByEyarhit
git pull
GIT_PULL_BI.cmd
```

`GIT_PULL_BI.cmd` régénère le projet Power BI, nettoie le cache `.pbi` et ouvre le PBIP si Desktop est installé.

---

## 3. Démarrer la stack BI

À la racine du repo :

```cmd
docker compose up -d mysql
docker compose run --rm talend-etl
docker compose up -d bi-hub
```

Vérifier le Hub : http://localhost:3032/api/health  
→ `mysql: true`, `dw: true` après ETL.

Mot de passe lecture BI MySQL : voir `docker/mysql-init/02-findme-bi-readonly.sql` (utilisateur `findme_bi`).

---

## 4. Power BI Desktop (4 pages)

1. Fermer Power BI s’il était ouvert.
2. Lancer `ONE_COMMANDE_POWERBI.cmd` **ou** ouvrir  
   `bi/powerbi/FindMe-Dashboard/FindMe-Dashboard.pbip`
3. **Actualiser** le modèle.
4. Connexion : `localhost:3306`, base **`findme_dw`**, utilisateur **`findme_bi`** (pas `root` / `admin`).

Onglets attendus :

| Page | Contenu |
|------|---------|
| 01 - Executive | KPI direction |
| 02 - Managerial | RH / missions |
| 03 - Operationnel | Utilisateurs, CV, notifs |
| 04 - Technique | Quiz, CodinGame, logs ETL |

Si la page **04** est vide ou avec des 0 :

```cmd
FIX_PAGE04_TECHNIQUE.cmd
```

Puis **Actualiser** à nouveau.

Doc détaillée : `bi/powerbi/GUIDE_AUTRE_PC.md`, `bi/powerbi/POWERBI_TABLES_ET_MESURES.md`.

---

## 5. Application Find-Me — session admin BI

### Lancer le front (dev)

```cmd
cd find-me-front-2.1
npm install
ng serve
```

Ouvrir : http://localhost:4200

### Compte admin (démo)

| Champ | Valeur |
|--------|--------|
| Email | `admin@gmail.com` |
| Mot de passe | `admin` |
| Rôle | ADMIN (table `user_bd`) |

Menu admin → **Tableaux de bord BI** (`/admin/bi-dashboard`).

### Ce que l’ami doit voir

- Bandeau **statut Hub** (vert si DW alimenté).
- **KPI live** (utilisateurs, missions, candidatures, CV) depuis `findme_dw`.
- Bouton **Lancer ETL Talend** (nécessite `bi-hub` sur le port 3032).
- Onglets **Executive / Managerial / Operationnel / Technique** (catalogue SQL + pages PBI).
- Section repliable **Guide ami après git pull**.

Si le statut est rouge : `docker compose up -d mysql bi-hub` puis relancer l’ETL.

---

## 6. Checklist de validation (5 min)

- [ ] `git pull` + `GIT_PULL_BI.cmd` sans erreur
- [ ] Power BI : 4 onglets visibles, **Actualiser** OK
- [ ] Page 04 : tableau `etl_run_log` + carte **Runs ETL OK** > 0
- [ ] App : login admin → page BI → KPI non vides après ETL
- [ ] Hub http://localhost:3032 → health `dw: true`

Problèmes connus : `bi/powerbi/README.md` (section dépannage).

---

## 7. Contacter eyarh

En cas de blocage, envoyer :

1. Capture Power BI (onglet + message d’erreur).
2. Sortie de `docker compose ps`.
3. JSON de http://localhost:3032/api/health
