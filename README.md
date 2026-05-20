# FindMe — findMeByEyarhit

Plateforme de recrutement (Angular + microservices Spring + parser CV Python).

## Démarrage rapide (Docker)

**Prérequis :** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Compose v2).

```cmd
git clone https://github.com/eyarhit/findMeByEyarhit.git
cd findMeByEyarhit
docker compose build --no-cache
docker compose up -d
```

Application : **http://localhost:4200** (Ctrl+F5 après mise à jour).

Voir [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) pour les ports et le dépannage.

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
