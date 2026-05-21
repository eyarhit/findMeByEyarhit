# Guide pour un ami — lancer Find-Me avec Docker (version actuelle)

Ce guide couvre **tout ce qui a changé** : correctifs RH/candidatures/CV/notifications, e-mails OTP, parser CV Python, **BI Metabase** (entrepôt en étoile + 3 dashboards), admin BI dans l’app.

**Prérequis :** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et **démarré** (icône verte).

---

## 1. Récupérer le projet

**Première fois :**

```cmd
git clone https://github.com/eyarhit/findMeByEyarhit.git
cd findMeByEyarhit
```

**Déjà cloné — mise à jour :**

```cmd
cd findMeByEyarhit
git pull
```

Vérifier que le clone est complet :

```cmd
dir find-me-back-2.1\Cv_service
dir find-me-python-2.1\app
dir bi\bi_etl
```

Si un dossier est vide → refaire un `git clone` propre.

---

## 2. E-mails (OTP, mot de passe oublié) — optionnel mais recommandé

Le fichier `.env` **n’est pas sur GitHub** (secrets). Chaque personne crée le sien :

```cmd
copy env.mail.example .env
```

Éditer `.env` à la racine :

```env
SPRING_MAIL_USERNAME=votre@gmail.com
SPRING_MAIL_PASSWORD=mot_de_passe_application_google_16_caracteres
```

(Google : Compte → Sécurité → Validation en 2 étapes → **Mots de passe des applications**.)

Sans `.env`, l’app tourne mais les **e-mails ne partent pas**.

---

## 3. Build (première fois ou après gros `git pull`)

Le build Java en parallèle peut échouer (réseau lent). **Méthode recommandée Windows :**

```cmd
cd findMeByEyarhit
scripts\docker-build-backend.cmd
docker compose build frontend python-service metabase-seed bi-etl
```

PowerShell :

```powershell
.\scripts\docker-build-backend.ps1
docker compose build frontend python-service metabase-seed bi-etl
```

**Mise à jour normale** (changements front/back/python/BI) :

```cmd
git pull
docker compose build frontend python-service user-service metabase-seed bi-etl
```

---

## 4. Démarrer toute la plateforme

```cmd
docker compose up -d
```

**Ordre automatique (important) :**

1. MySQL, MinIO, microservices Java, Python  
2. **`findme-bi-etl`** — charge l’entrepôt `findme_dw` (schéma en étoile) → conteneur **s’arrête** (normal)  
3. Metabase démarre  
4. **`findme-metabase-seed`** — crée dashboards + `bi-manifest.json` → **s’arrête** (normal)  
5. **Frontend** démarre en dernier  

La **première fois** : compter **5 à 15 minutes** (Maven déjà en cache = plus rapide).

### Suivre la progression

```cmd
docker compose ps -a
docker logs findme-bi-etl
docker logs findme-metabase-seed
```

Messages attendus :

- `ETL terminé avec succès.`
- `Manifest BI écrit`
- `Dashboard « Find-Me — BI Executive »` (et Managérial, Opérationnel)

---

## 5. Ouvrir l’application

| Service | URL | Remarque |
|---------|-----|----------|
| **Application** | http://localhost:4200 | Ctrl+Shift+R si page blanche ou sans CSS |
| **Metabase (BI)** | http://localhost:3030 | Voir §6 |
| Gateway API | http://localhost:9082 | Debug |
| MinIO (fichiers) | http://localhost:9001 | minioadmin / minioadmin |

**Comptes :** utiliser ceux créés dans l’app (inscription) ou ceux de votre équipe.

**Rôles utiles pour tester :**

- **ADMIN** → menu **Tableaux de bord BI**
- **CANDIDAT** → CV, candidatures, certificats
- **ESN / RH** → missions, liste candidatures

---

## 6. BI Metabase (nouveau)

### Connexion Metabase

| Champ | Valeur |
|-------|--------|
| URL | http://localhost:3030 |
| Email | `bi-admin@findme.local` |
| Mot de passe | `FindMe_BI_Auto_2026!xQ7vM2` |

### Dashboards (3 niveaux)

- **Find-Me — BI Executive**
- **Find-Me — BI Managérial**
- **Find-Me — BI Opérationnel**

### Dans l’app Angular

1. Se connecter en **ADMIN**
2. Aller à **Tableaux de bord BI**
3. Choisir Executive / Managérial / Opérationnel → **Ouvrir dans Metabase**

Si la page dit « Manifest vide » → §7 ci-dessous.

---

## 7. Après utilisation de l’app (données BI à jour)

Les graphiques lisent l’entrepôt `findme_dw`. Après avoir créé missions, candidatures, CV, etc. :

```cmd
docker compose run --rm bi-etl
```

Ou :

```powershell
.\scripts\bi_refresh.ps1
```

Puis rafraîchir les questions dans Metabase (F5).

---

## 8. Mise à jour sans tout casser

```cmd
cd findMeByEyarhit
git pull
docker compose build frontend python-service user-service cv-service mission-service metabase-seed bi-etl
docker compose up -d --force-recreate
```

Ne pas faire `docker compose down -v` sauf si vous voulez **effacer toutes les données** (MySQL, Metabase, MinIO).

---

## 9. Dépannage fréquent

### `bi-etl` exit 1 (service didn't complete successfully)

**Cause fréquente :** volume MySQL **déjà existant** sans les tables `etl_run_log` / `dim_user_scd2`.

```cmd
docker logs findme-bi-etl
```

Puis **après un `git pull` récent** :

```cmd
docker compose build bi-etl
docker compose run --rm bi-etl
```

Si ça échoue encore, voir la dernière ligne `ERREUR ETL:` dans les logs.

**Contournement pour démarrer l’app sans attendre l’ETL** (BI vide temporairement) :

```cmd
docker compose up -d --no-deps frontend gateway-service user-service cv-service mission-service python-service
```

*(La BI nécessite quand même un ETL réussi pour les graphiques.)*

### Le frontend ne démarre pas (bloqué sur bi-etl ou metabase-seed)

```cmd
docker logs findme-bi-etl
docker logs findme-metabase-seed
```

Relancer seulement ces services :

```cmd
docker compose run --rm bi-etl
docker compose run --rm metabase-seed
docker compose up -d frontend
```

### Page http://localhost:4200 sans CSS

```cmd
docker compose build --no-cache frontend
docker compose up -d --force-recreate frontend
```

Puis **Ctrl+Shift+R** ou navigation privée.

### Erreur build Maven

```cmd
scripts\docker-build-backend.cmd
```

Puis `docker compose up -d`.

### Port 4200 ou 3030 déjà utilisé

Arrêter l’autre programme ou changer le port dans `docker-compose.yml` (section `ports`).

### Conteneurs « findme » fantômes

```cmd
docker compose down --remove-orphans
docker compose up -d
```

### BI / Metabase ancien ou dashboards manquants

Reset **uniquement** Metabase (garde les données app MySQL) :

```cmd
docker compose stop metabase metabase-seed frontend
docker volume rm findmebyeyarhit_metabase_data
docker compose up -d metabase
timeout /t 60
docker compose run --rm metabase-seed
docker compose up -d frontend
```

*(Le nom du volume peut varier : `docker volume ls | findstr metabase`.)*

### Certificats / candidatures / notifications

Aucune config Docker spéciale : après `git pull` + rebuild `frontend` et `user-service` / `mission-service` si besoin :

```cmd
docker compose build frontend user-service mission-service
docker compose up -d --force-recreate frontend user-service mission-service
```

---

## 10. Arrêter proprement

```cmd
docker compose down
```

Pour tout supprimer y compris les bases :

```cmd
docker compose down -v
```

---

## 11. Récap des changements importants (depuis l’ancienne version)

| Sujet | Ce qui a changé |
|-------|------------------|
| Candidatures / certificats | Correctifs front (liste certificats, navigation notifications) |
| CV | Nom du CV conservé après sauvegarde ; parser Python compétences |
| E-mail | `.env` local + `env.mail.example` (plus de mot de passe en dur dans Git) |
| BI | Entrepôt `findme_dw`, ETL `bi-etl`, 3 dashboards Metabase, page admin BI |
| Docker | Le front attend la fin de `bi-etl` et `metabase-seed` au premier `up` |

---

## 12. Aide rapide

- Déploiement détaillé : [DOCKER_DEPLOYMENT.md](../DOCKER_DEPLOYMENT.md)
- BI : [BI_METABASE.md](../BI_METABASE.md) et [bi/README.md](../bi/README.md)
- Slides PFE : [BI_PRESENTATION_PFE.md](./BI_PRESENTATION_PFE.md)
