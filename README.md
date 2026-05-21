# FindMe — findMeByEyarhit

Plateforme de recrutement (Angular + microservices Spring + parser CV Python).

## Démarrage rapide (Docker)

**Prérequis :** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Compose v2).

```cmd
git clone https://github.com/eyarhit/findMeByEyarhit.git
cd findMeByEyarhit
git pull
scripts\docker-build-backend.cmd
docker compose build frontend python-service metabase-seed
docker compose up -d
```

If `docker compose build` fails on Maven downloads, use the script above (builds Java services one at a time). See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md).

Application : **http://localhost:4200** (Ctrl+Shift+R après mise à jour).

### Page sans CSS (HTML brut)

```cmd
git pull
dir find-me-front-2.1\tailwind.config.js
docker compose build --no-cache frontend
docker compose up -d --force-recreate frontend
```

Puis **Ctrl+Shift+R** ou fenêtre privée. Vérifier : `powershell -File scripts\verify-frontend-css.ps1` (CSS &gt; 20 Ko = OK).

Voir [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) pour les ports et le dépannage.

**Guide pas à pas pour un collègue :** [docs/GUIDE_AMI_DOCKER.md](./docs/GUIDE_AMI_DOCKER.md)

## Important — clone complet

Les dossiers `find-me-back-2.1` et `find-me-python-2.1` doivent contenir le **code source** (sous-dossiers `DiscoveryService`, `Cv_service`, `app`, etc.).

Si `docker compose build` affiche `path ... not found` :

1. Supprimez le dossier cloné.
2. Reclonez depuis GitHub (commandes ci-dessus).
3. Vérifiez : `dir find-me-back-2.1\Cv_service` doit lister des fichiers.

## Mise à jour

```cmd
cd findMeByEyarhit
git pull
docker compose down
docker compose build --no-cache
docker compose up -d --force-recreate
```
