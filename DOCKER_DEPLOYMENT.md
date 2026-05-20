# Docker Deployment (One Command)

## Prerequisites

- Docker Desktop installed and running.
- Docker Compose v2 available (`docker compose` command).

No Java, Node, Python, or MySQL installation is required on the client machine.

## Start Entire Platform

From the project root (`D:\projetpfe`), run:

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:4200`
- Gateway: `http://localhost:9082`
- Eureka: `http://localhost:8761`
- MinIO Console: `http://localhost:9001` (user: `minioadmin`, password: `minioadmin`)
- Metabase (BI): `http://localhost:3030` — au premier `docker compose up`, le service **`metabase-seed`** crée le compte admin, les bases, les graphiques et le tableau de bord **« Find-Me — BI complet »** (voir `BI_METABASE.md` pour identifiants et dépannage).

## Stop

```bash
docker compose down
```

To remove volumes (database + object storage):

```bash
docker compose down -v
```

## Included Services

- `frontend` (Angular + Nginx)
- `python-service` (FastAPI)
- `discovery-service` (Eureka)
- `gateway-service` (Spring Cloud Gateway)
- `user-service`
- `cv-service`
- `mission-service`
- `quiz-service`
- `codingame-service`
- `mysql` (init SQL dans `docker/mysql-init/` : bases + utilisateur BI `findme_bi`)
- `metabase` (port `3030`, données persistantes dans le volume `metabase_data`)
- `metabase-seed` (tâche unique : provisionnement BI ; se termine puis s’arrête)
- `minio` + `minio-init` (creates `find-me` bucket)

## Notes

- Services are configured through Docker Compose environment variables so they communicate via container DNS (`mysql`, `discovery-service`, `minio`).
- Frontend keeps using `localhost` API URLs, which works because backend ports are published on the host.
- If `docker compose up` reports `ports are not available`, free these host ports first: `3030`, `4200`, `8000`, `8761`, `9055`, `9056`, `9068`, `9074`, `9082`, `9158`, `9000`, `9001`.
