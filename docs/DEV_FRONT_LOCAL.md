# Dev — front local + back / BD sur Docker

Configuration recommandée quand le **front Docker** pose problème : Angular en local, tout le reste en conteneurs.

## 1. Docker (back + MySQL + CodinGame)

```cmd
cd findMeByEyarhit
git pull
scripts\docker-back-only.cmd
```

Services démarrés (sans `findme-frontend`) :

| Service | Port |
|---------|------|
| MySQL | 3306 |
| user-service | 9068 |
| cv-service | 9158 |
| mission-service | 9055 |
| quiz-service | 9074 |
| **codingame-service** | **9056** |
| python-service | 8000 |
| gateway | 9082 |
| bi-hub (optionnel) | 3032 |

ETL BI si besoin :

```cmd
docker compose run --rm talend-etl
```

## 2. Front Angular (local)

Autre terminal :

```cmd
scripts\run-front-local.cmd
```

Ou :

```cmd
cd find-me-front-2.1
npm install --legacy-peer-deps
npm run dev
```

Ouvrir : **http://localhost:4200**

Admin : `admin@gmail.com` / `admin`

## 3. Pourquoi ça marche

Le front appelle déjà `http://localhost:9068`, `9055`, `9158`, `9056`, etc. — les ports exposés par Docker. Aucun changement de code si les conteneurs back tournent.

Le proxy dev (`proxy.conf.json`) ne sert que pour `/bi-api` → Hub BI (3032).

## 4. Arrêter le front Docker (libérer le port 4200)

```cmd
docker compose stop frontend
```

Sinon `ng serve` et le conteneur se battent pour le port **4200**.

## 5. Power BI

Toujours sur **Windows** (Desktop), pas dans le conteneur front :

```cmd
ONE_COMMANDE_POWERBI.cmd
```

Connexion : `localhost:3306` / `findme_dw` / `findme_bi`
