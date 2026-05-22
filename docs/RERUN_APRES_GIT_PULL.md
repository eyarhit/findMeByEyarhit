# Relancer après `git pull`

## Toi — front local + back Docker

```cmd
git pull
scripts\docker-back-only.cmd
```

Si le back a changé (Java) :

```cmd
docker compose build user-service cv-service mission-service quiz-service codingame-service
docker compose up -d --force-recreate user-service cv-service mission-service quiz-service codingame-service
```

Front :

```cmd
scripts\run-front-local.cmd
```

→ http://localhost:4200

---

## Ton ami — tout en Docker

```cmd
git pull
docker compose stop frontend
scripts\docker-build-frontend.cmd
docker compose up -d --force-recreate frontend
```

Back sans reconstruire le front :

```cmd
docker compose build user-service mission-service
docker compose up -d --force-recreate user-service mission-service
```

---

## CV : nom au téléchargement

1. Remplir **Nom du cv** → **Sauvegarder**
2. **Télécharger** utilise le même nom (pas le nom/prénom compte seul)

---

## Power BI après nouveaux candidats

```cmd
scripts\refresh-dw-for-powerbi.cmd
```

Puis **Actualiser** dans Power BI Desktop.
