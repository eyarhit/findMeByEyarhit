# Guide ami — tester après `git pull` (100 % Docker)

Pour un ami qui **ne compile pas** Node/Java en local : tout passe par **Docker Desktop**.

Dépôt : https://github.com/eyarhit/findMeByEyarhit

Guide plateforme complète : [docs/GUIDE_AMI_DOCKER.md](../docs/GUIDE_AMI_DOCKER.md)  
Checklist BI détaillée : [docs/CHECKLIST_VALIDATION_BI_AMI.md](../docs/CHECKLIST_VALIDATION_BI_AMI.md)

---

## Prérequis

| Outil | Obligatoire |
|--------|-------------|
| **Docker Desktop** | Oui (icône verte) |
| **Git** | Oui |
| **Power BI Desktop** | Oui pour les 4 pages PBIP (sur Windows, hors conteneur) |
| Node.js / Java / MySQL local | **Non** |

---

## 1. Récupérer le code

**Première fois :**

```cmd
git clone https://github.com/eyarhit/findMeByEyarhit.git
cd findMeByEyarhit
```

**Mise à jour :**

```cmd
cd findMeByEyarhit
git pull
```

Option Power BI (Windows, régénère le PBIP) :

```cmd
GIT_PULL_BI.cmd
```

---

## 2. Démarrer toute la plateforme (Docker)

### Méthode recommandée — une commande

```cmd
scripts\docker-compose-up.cmd
```

*(équivalent à `scripts\bi-start.cmd` : build si besoin, `docker compose up -d`, ETL, services BI)*

### Méthode manuelle (si la commande ci-dessus échoue)

```cmd
scripts\docker-build-backend.cmd
docker compose build frontend python-service talend-etl bi-hub
docker compose up -d
docker compose run --rm talend-etl
```

Attendre 2–5 min la première fois. Vérifier :

```cmd
docker compose ps
```

| Conteneur | État attendu |
|-----------|----------------|
| `findme-mysql` | healthy |
| `findme-frontend` | Up |
| `findme-bi-hub` | Up |

---

## 3. Vérifier l’entrepôt BI (findme_dw)

```cmd
docker compose exec mysql mysql -ufindme_bi -pfindme_bi_readonly -e "SELECT COUNT(*) AS dates FROM findme_dw.dim_date;"
```

Nombre **> 0** → ETL OK.

Relancer l’ETL si besoin :

```cmd
docker compose run --rm talend-etl
```

Hub BI (console + bouton ETL) : http://localhost:3032  
Santé : http://localhost:3032/api/health → `"dw": true`

---

## 4. Application Find-Me (admin BI) — Docker

| Élément | Valeur |
|---------|--------|
| **URL** | http://localhost:4200 |
| **Email admin** | `admin@gmail.com` |
| **Mot de passe** | `admin` |

1. Ouvrir http://localhost:4200 (Ctrl+Shift+R si page sans style).
2. Se connecter en **ADMIN**.
3. Menu → **Tableaux de bord BI** (`/admin/bi-dashboard`).

### Ce que l’ami doit voir

- Bandeau **vert** : entrepôt prêt (Hub sur port 3032).
- **KPI live** (utilisateurs, missions, candidatures, CV).
- Bouton **Lancer ETL Talend** (appelle le Hub Docker).
- Onglets **Executive / Managerial / Operationnel / Technique** (liés aux 4 pages Power BI).

Si bandeau rouge :

```cmd
docker compose up -d mysql bi-hub
docker compose run --rm talend-etl
```

Puis F5 sur la page BI.

**Pas de `npm install` ni `ng serve`** — le front est le conteneur `findme-frontend` (port 4200 → nginx).

Rebuild front après un gros `git pull` :

```cmd
scripts\docker-build-frontend.cmd
docker compose up -d --force-recreate frontend
```

Si `npm error ECONNRESET` pendant le build : relancer le script (3 essais) ou installer d’abord en local :

```cmd
cd find-me-front-2.1
npm install --legacy-peer-deps
cd ..
docker compose build frontend
```

Ne pas lancer `docker compose build` sans nom de service (rebuild tout le backend + front = long et fragile).

---

## 5. Power BI Desktop (hôte Windows)

Power BI tourne **sur la machine**, pas dans Docker (connexion vers MySQL exposé par Docker).

1. `ONE_COMMANDE_POWERBI.cmd` ou ouvrir  
   `bi/powerbi/FindMe-Dashboard/FindMe-Dashboard.pbip`
2. **Actualiser**
3. Connexion : `localhost:3306`, base **`findme_dw`**, utilisateur **`findme_bi`**

| Onglet | Contenu |
|--------|---------|
| 01 - Executive | KPI direction |
| 02 - Managerial | RH / missions |
| 03 - Operationnel | Activité |
| 04 - Technique | Quiz, CDG, logs ETL |

Page 04 vide → `FIX_PAGE04_TECHNIQUE.cmd` puis **Actualiser**.

---

## 6. URLs utiles (tout Docker)

| Service | URL |
|---------|-----|
| Application + admin BI | http://localhost:4200 |
| Hub BI | http://localhost:3032 |
| Talend Studio (VNC, optionnel) | http://localhost:6080 (mdp `findme`) |
| Gateway API | http://localhost:9082 |

---

## 7. Checklist rapide (5–10 min)

- [ ] `git pull` OK
- [ ] `docker compose ps` → mysql healthy, frontend + bi-hub Up
- [ ] `talend-etl` terminé sans erreur
- [ ] http://localhost:3032/api/health → `"dw": true`
- [ ] http://localhost:4200 → login admin → page BI avec KPI
- [ ] Power BI : 4 onglets + Actualiser OK

---

## 8. Dépannage Docker

| Problème | Action |
|----------|--------|
| `bi-start.ps1` / `DOCKER_TEST_AMI.cmd` échoue à l’étape GRANT (warning MySQL rouge) | `git pull` puis relancer — correctif PowerShell dans `scripts/bi-start.ps1` |
| Page admin affiche encore « Power BI portail » / `.pbix` | Image front ancienne : `docker compose build frontend` puis `docker compose up -d --force-recreate frontend` |
| Port 4200 occupé | Arrêter l’autre app ou changer le port dans `docker-compose.yml` |
| Page 4200 sans CSS | `docker compose build --no-cache frontend` puis `--force-recreate frontend` |
| ETL exit 1 | `docker compose logs talend-etl` puis `docs/GUIDE_AMI_DOCKER.md` §9 |
| Hub BI inaccessible | `docker compose up -d bi-hub` |
| Front pas à jour | `git pull` + rebuild `frontend` (§4) |

---

## 9. En cas de blocage

Envoyer à eyarh :

1. `docker compose ps`
2. JSON http://localhost:3032/api/health
3. Capture page admin BI + Power BI (si testé)
