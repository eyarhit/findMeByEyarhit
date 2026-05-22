# Front local + backends Docker

## Prérequis

- **Node.js 20+** (22 recommandé, comme le Dockerfile)
- **Docker Desktop** avec MySQL + microservices démarrés

## 1. Démarrer Docker (sans le front conteneur)

```cmd
cd findMeByEyarhit
docker compose stop frontend
docker compose up -d
```

Ou backends essentiels seulement :

```cmd
scripts\docker-app-up.cmd
docker compose stop frontend
```

Vérifier : `docker compose ps` → gateway **9082**, user **9068**, mission **9055**, etc.

## 2. Installer et lancer le front

```cmd
cd find-me-front-2.1
npm install --legacy-peer-deps
npm run dev
```

Équivalent : `npm start` (pas `npm run build` pour tester).

Ouvrir : **http://localhost:4200**

## Scripts npm

| Commande | Effet |
|----------|--------|
| `npm run dev` | `ng serve` port 4200 |
| `npm start` | idem |
| `npm run build` | build production (Docker) |

## Admin / BI

- Login : `admin@gmail.com` / `admin`
- Hub BI Docker : http://localhost:3032 (le front appelle ce port depuis le navigateur)

## Dépannage

| Problème | Solution |
|----------|----------|
| Port 4200 déjà utilisé | `docker compose stop frontend` puis relancer `npm run dev` |
| API 401 / erreur réseau | Vérifier `docker compose ps` et gateway sur **9082** |
| `npm install` ECONNRESET | Relancer ou VPN off ; même commande avec retry |

## Revenir au front Docker

```cmd
Ctrl+C dans le terminal npm
docker compose up -d --build frontend
```
