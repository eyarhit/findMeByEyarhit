#!/usr/bin/env python3
"""Console BI Find-Me — Talend ETL + aperçu Power BI (navigateur), sans config manuelle."""
from __future__ import annotations

import os
import subprocess
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

import pymysql
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

MYSQL_HOST = os.environ.get("MYSQL_HOST", "mysql")
MYSQL_PORT = int(os.environ.get("MYSQL_PORT", "3306"))
MYSQL_USER = os.environ.get("MYSQL_ETL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_ETL_PASSWORD", "root")
DW = "findme_dw"
BI_AUTO_ETL = os.environ.get("BI_AUTO_ETL", "1").strip().lower() in ("1", "true", "yes")
ETL_SCRIPT = os.environ.get("ETL_SCRIPT", "/app/etl_load_dw.py")
REPORTS_DIR = Path(os.environ.get("REPORTS_DIR", "/app/reports"))

_etl_lock = threading.Lock()
_etl_running = False
_etl_log: list[str] = []
_etl_last_success: str | None = None
_etl_last_error: str | None = None


def _connect(db: str | None = None):
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=db,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def _wait_mysql(max_wait: int = 120) -> None:
    deadline = time.time() + max_wait
    while time.time() < deadline:
        try:
            c = _connect("mysql")
            c.close()
            return
        except pymysql.err.OperationalError:
            time.sleep(2)
    raise RuntimeError("MySQL indisponible")


def _dw_needs_etl() -> bool:
    try:
        with _connect(DW) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS n FROM dim_date")
                row = cur.fetchone() or {}
                return int(row.get("n") or row.get("N") or 0) == 0
    except pymysql.err.ProgrammingError:
        return True
    except pymysql.err.OperationalError:
        return True


def _append_log(line: str) -> None:
    _etl_log.append(line.rstrip())
    if len(_etl_log) > 3000:
        del _etl_log[:500]


def _run_etl_blocking() -> bool:
    global _etl_running, _etl_last_success, _etl_last_error
    with _etl_lock:
        if _etl_running:
            return False
        _etl_running = True
    _etl_log.clear()
    _append_log(f"[{datetime.now(timezone.utc).isoformat()}] Démarrage ETL Talend (runtime Docker)…")
    env = os.environ.copy()
    env.setdefault("MYSQL_HOST", MYSQL_HOST)
    env.setdefault("MYSQL_PORT", str(MYSQL_PORT))
    env.setdefault("MYSQL_ETL_USER", MYSQL_USER)
    env.setdefault("MYSQL_ETL_PASSWORD", MYSQL_PASSWORD)
    try:
        proc = subprocess.Popen(
            ["python", ETL_SCRIPT],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            env=env,
        )
        assert proc.stdout is not None
        for line in proc.stdout:
            _append_log(line.rstrip())
        proc.wait()
        ok = proc.returncode == 0
        if ok:
            _etl_last_success = datetime.now(timezone.utc).isoformat()
            _etl_last_error = None
        else:
            _etl_last_error = f"Code sortie ETL : {proc.returncode}"
        return ok
    except Exception as exc:
        _etl_last_error = str(exc)
        _append_log(f"ERREUR: {exc}")
        return False
    finally:
        with _etl_lock:
            _etl_running = False


def _maybe_auto_etl() -> None:
    if not BI_AUTO_ETL:
        return
    try:
        _wait_mysql()
        if _dw_needs_etl():
            _append_log("findme_dw vide — lancement ETL automatique (BI_AUTO_ETL)…")
            _run_etl_blocking()
    except Exception as exc:
        _append_log(f"Auto-ETL ignoré : {exc}")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    threading.Thread(target=_maybe_auto_etl, daemon=True, name="bi-auto-etl").start()
    yield


app = FastAPI(title="Find-Me BI Hub", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")


@app.get("/")
async def index():
    return FileResponse(Path(__file__).parent / "static" / "index.html")


@app.get("/api/health")
async def health():
    mysql_ok = False
    dw_ok = False
    dim_rows = 0
    err = None
    try:
        _wait_mysql(5)
        mysql_ok = True
        with _connect(DW) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS n FROM dim_date")
                row = cur.fetchone() or {}
                dim_rows = int(row.get("n") or row.get("N") or 0)
                dw_ok = dim_rows > 0
    except Exception as exc:
        err = str(exc)
    return {
        "status": "ok" if mysql_ok and dw_ok else ("degraded" if mysql_ok else "error"),
        "mysql": mysql_ok,
        "dw": dw_ok,
        "dimDateRows": dim_rows,
        "etlRunning": _etl_running,
        "etlLastSuccess": _etl_last_success,
        "etlLastError": _etl_last_error,
        "autoEtl": BI_AUTO_ETL,
        "error": err,
    }


@app.get("/api/etl/status")
async def etl_status():
    return {
        "running": _etl_running,
        "lastSuccess": _etl_last_success,
        "lastError": _etl_last_error,
        "logLines": len(_etl_log),
    }


@app.get("/api/etl/log")
async def etl_log(tail: int = 400):
    n = max(50, min(tail, 3000))
    return {"lines": _etl_log[-n:]}


@app.post("/api/etl/run")
async def etl_run():
    if _etl_running:
        raise HTTPException(409, "ETL déjà en cours")
    threading.Thread(target=_run_etl_blocking, daemon=True, name="bi-etl-run").start()
    return {"started": True}


@app.get("/api/dw/stats")
async def dw_stats():
    tables = (
        "dim_date",
        "dim_user",
        "dim_mission",
        "fact_candidature",
        "fact_cv",
        "fact_user",
        "fact_mission",
    )
    counts: dict[str, int] = {}
    try:
        with _connect(DW) as conn:
            with conn.cursor() as cur:
                for t in tables:
                    cur.execute(f"SELECT COUNT(*) AS n FROM `{t}`")
                    row = cur.fetchone() or {}
                    counts[t] = int(row.get("n") or row.get("N") or 0)
    except Exception as exc:
        raise HTTPException(503, str(exc)) from exc
    return {"database": DW, "tables": counts}


@app.get("/api/kpis/executive")
async def kpis_executive():
    sql = """
    SELECT
      (SELECT COALESCE(SUM(user_count),0) FROM fact_user) AS total_utilisateurs,
      (SELECT COALESCE(SUM(mission_count),0) FROM fact_mission) AS total_missions,
      (SELECT COALESCE(SUM(candidature_count),0) FROM fact_candidature) AS total_candidatures,
      (SELECT COALESCE(SUM(cv_count),0) FROM fact_cv) AS total_cv
    """
    try:
        with _connect(DW) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                row = cur.fetchone() or {}
        return {k: int(v or 0) for k, v in row.items()}
    except Exception as exc:
        raise HTTPException(503, str(exc)) from exc


@app.get("/api/kpis/candidatures_par_mois")
async def kpis_candidatures_mois():
    sql = """
    SELECT d.year_number AS y, d.month_number AS m,
           SUM(f.candidature_count) AS total
    FROM fact_candidature f
    JOIN dim_date d ON d.date_key = f.date_key
    GROUP BY d.year_number, d.month_number
    ORDER BY y, m
    LIMIT 24
    """
    try:
        with _connect(DW) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
        return [
            {
                "label": f"{r.get('m') or r.get('M')}/{r.get('y') or r.get('Y')}",
                "value": int(r.get("total") or r.get("TOTAL") or 0),
            }
            for r in rows
        ]
    except Exception as exc:
        raise HTTPException(503, str(exc)) from exc


@app.get("/api/powerbi/connection")
async def powerbi_connection():
    return {
        "server": os.environ.get("PBI_SERVER", "localhost"),
        "port": int(os.environ.get("PBI_PORT", "3306")),
        "database": DW,
        "user": os.environ.get("PBI_USER", "findme_bi"),
        "password": os.environ.get("PBI_PASSWORD", "findme_bi_readonly"),
        "connectionString": (
            f"Server=localhost;Port=3306;Database={DW};"
            "Uid=findme_bi;Pwd=findme_bi_readonly;"
        ),
    }


@app.get("/api/powerbi/reports")
async def powerbi_reports():
    files = []
    if REPORTS_DIR.is_dir():
        for p in sorted(REPORTS_DIR.glob("*.pbix")):
            files.append({"name": p.name, "url": f"/api/powerbi/download/{p.name}"})
    return {"reports": files}


@app.get("/api/powerbi/download/{filename}")
async def download_pbix(filename: str):
    safe = Path(filename).name
    path = REPORTS_DIR / safe
    if not path.is_file() or path.suffix.lower() != ".pbix":
        raise HTTPException(404, "Rapport introuvable")
    return FileResponse(path, filename=safe, media_type="application/octet-stream")
