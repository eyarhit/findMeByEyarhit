# Docker Deployment (One Command)

## Prerequisites

- Docker Desktop installed and running.
- Docker Compose v2 available (`docker compose` command).

No Java, Node, Python, or MySQL installation is required on the client machine.

## Clone (first time)

```bash
git clone https://github.com/eyarhit/findMeByEyarhit.git
cd findMeByEyarhit
```

After clone, confirm backend is present (not an empty folder):

```bash
# Windows
dir find-me-back-2.1\Cv_service
dir find-me-back-2.1\DiscoveryService
```

If those paths are missing, the repository clone is incomplete — use a fresh `git clone` from the URL above.

## Start Entire Platform

From the project root, run:

```bash
docker compose build --no-cache
docker compose up -d
```

Or in one step:

```bash
docker compose up --build -d
```

### Slow network / Maven download errors

If the build fails with messages like:

`Premature end of Content-Length delimited message body`  
`Could not transfer artifact org.springframework.boot:spring-boot:jar`

the connection to Maven Central was interrupted (often because **7 Java services download in parallel**).

**Recommended (Windows):** build backend services **one by one**:

```cmd
cd findMeByEyarhit
scripts\docker-build-backend.cmd
docker compose build frontend python-service metabase-seed
docker compose up -d
```

PowerShell:

```powershell
.\scripts\docker-build-backend.ps1
docker compose build frontend python-service metabase-seed
docker compose up -d
```

Or limit parallel builds:

```cmd
set COMPOSE_PARALLEL_LIMIT=1
docker compose build
```

Then retry only the failed service, e.g. `docker compose build user-service`.

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

### Container name already in use (`findme-python`, `findme-minio`, …)

Old containers from a previous run still exist. From the project root:

```cmd
cd findMeByEyarhit
docker compose down --remove-orphans
for /f %i in ('docker ps -a --filter "name=findme" -q') do docker rm -f %i
docker compose up -d
```

PowerShell:

```powershell
docker compose down --remove-orphans
docker ps -a --filter "name=findme" -q | ForEach-Object { docker rm -f $_ }
docker compose up -d
```

Data in volumes (`mysql_data`, etc.) is kept unless you use `docker compose down -v`.

### Page without CSS (HTML only, no layout)

The app uses **Tailwind CSS**. Config files `tailwind.config.js` and `postcss.config.js` must be in the repo. After `git pull`:

```cmd
docker compose build --no-cache frontend
docker compose up -d --force-recreate frontend
```

Then hard-refresh the browser: **Ctrl+F5** on http://localhost:4200

### `POST /api/v1/save` returns 500 (CV upload)

Usually an **outdated `cv-service` image** or a **stale MySQL volume** from an old schema. On the machine that fails:

```cmd
git pull
docker compose build --no-cache cv-service frontend
docker compose up -d --force-recreate cv-service frontend
docker compose logs --tail 80 cv-service
```

Check the last lines of logs for the real Java exception. If it persists, reset only CV data:

```cmd
docker compose down
docker volume rm findmebyeyarhit_mysql_data
docker compose up -d
```

(Wipes all DB data — users, offers, CVs.)

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
