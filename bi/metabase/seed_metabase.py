#!/usr/bin/env python3
"""
Provisionnement Metabase Find-Me : setup admin (si besoin), bases MySQL,
questions SQL natives, tableau de bord. Idempotent si le dashboard existe déjà.
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import requests

MB_URL = os.environ.get("METABASE_URL", "http://metabase:3000").rstrip("/")
MYSQL_HOST = os.environ.get("MYSQL_HOST", "mysql")
MYSQL_PORT = int(os.environ.get("MYSQL_PORT", "3306"))
MYSQL_USER = os.environ.get("MYSQL_USER", "findme_bi")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "findme_bi_readonly")

SETUP_EMAIL = os.environ.get("METABASE_SETUP_EMAIL", "bi-admin@findme.local")
SETUP_PASSWORD = os.environ.get(
    "METABASE_SETUP_PASSWORD", "FindMe_BI_Auto_2026!xQ7vM2"
)
SETUP_FIRST = os.environ.get("METABASE_SETUP_FIRST_NAME", "FindMe")
SETUP_LAST = os.environ.get("METABASE_SETUP_LAST_NAME", "BI")
SITE_NAME = os.environ.get("METABASE_SITE_NAME", "Find-Me BI")

COLLECTION_NAME = "Find-Me BI"
DASHBOARD_NAME = "Find-Me — BI complet"

SQL_ROOT = Path(__file__).resolve().parent / "sql"

# (fichier relatif sql/, clé base = nom dbname, titre carte, type d'affichage Metabase)
CARDS: list[tuple[str, str, str, str]] = [
    ("user_bd/01_utilisateurs_par_role.sql", "user_bd", "Utilisateurs par rôle", "bar"),
    ("user_bd/02_utilisateurs_par_statut.sql", "user_bd", "Utilisateurs par statut", "pie"),
    ("mission_bd/01_missions_par_statut.sql", "mission_bd", "Missions par statut", "pie"),
    ("mission_bd/02_missions_par_mois.sql", "mission_bd", "Missions créées par mois", "line"),
    ("mission_bd/03_candidatures_par_statut.sql", "mission_bd", "Candidatures par statut", "bar"),
    ("mission_bd/04_type_contrat.sql", "mission_bd", "Missions par type de contrat", "bar"),
    ("mission_bd/05_top_villes.sql", "mission_bd", "Top villes (missions)", "bar"),
    ("mission_bd/06_favoris_par_user_type.sql", "mission_bd", "Favoris par type utilisateur", "bar"),
    ("mission_bd/07_candidatures_par_mois.sql", "mission_bd", "Candidatures par mois", "line"),
    ("cv_bd/01_cv_par_mois.sql", "cv_bd", "CV créés par mois", "line"),
    ("quiz_bd/01_quiz_reussite.sql", "quiz_bd", "Quiz — réussite / échec", "pie"),
    ("codingame_bd/01_sessions_par_mois.sql", "codingame_bd", "Codingame — sessions par mois", "line"),
    ("codingame_bd/02_score_moyen.sql", "codingame_bd", "Codingame — score moyen", "table"),
]

DB_NAMES = ["user_bd", "mission_bd", "cv_bd", "quiz_bd", "codingame_bd"]


def as_item_list(payload) -> list:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        return payload.get("data") or payload.get("items") or []
    return []


def _props_key(props: dict, *keys: str):
    for k in keys:
        if k in props and props[k] is not None:
            return props[k]
    return None


def wait_for_metabase(sess: requests.Session) -> None:
    for i in range(120):
        try:
            r = sess.get(f"{MB_URL}/api/health", timeout=5)
            if r.ok:
                data = r.json()
                if data.get("status") == "ok":
                    print("Metabase: /api/health OK")
                    return
        except requests.RequestException:
            pass
        time.sleep(2)
        if i % 10 == 0:
            print(f"… attente Metabase ({i * 2}s)")
    print("ERREUR: Metabase ne répond pas à /api/health", file=sys.stderr)
    sys.exit(1)


def get_session_properties(sess: requests.Session) -> dict:
    r = sess.get(f"{MB_URL}/api/session/properties", timeout=30)
    r.raise_for_status()
    return r.json()


def _truthy(val) -> bool:
    return val in (True, "true", "TRUE", 1, "1")


def ensure_setup(sess: requests.Session, props: dict) -> str:
    """Retourne le jeton de session Metabase (X-Metabase-Session)."""
    setup_token = _props_key(props, "setup-token", "setup_token")
    has_setup = _props_key(props, "has-user-setup", "has_user_setup", "has-users-setup")

    if _truthy(has_setup):
        print("Metabase déjà initialisé — connexion admin…")
        r = sess.post(
            f"{MB_URL}/api/session",
            json={"username": SETUP_EMAIL, "password": SETUP_PASSWORD},
            timeout=60,
        )
        if not r.ok:
            print(
                r.text[:500],
                file=sys.stderr,
            )
            print(
                "ERREUR: connexion impossible. Utilise les identifiants du premier setup "
                "ou définis METABASE_SETUP_EMAIL / METABASE_SETUP_PASSWORD.",
                file=sys.stderr,
            )
            sys.exit(1)
        token = r.json().get("id")
        if not token:
            print("ERREUR: pas de session dans la réponse /api/session", file=sys.stderr)
            sys.exit(1)
        return token

    if not setup_token:
        print(
            "ERREUR: pas de setup-token et instance non marquée initialisée — état Metabase inattendu.",
            file=sys.stderr,
        )
        sys.exit(1)

    body = {
        "token": setup_token,
        "user": {
            "first_name": SETUP_FIRST,
            "last_name": SETUP_LAST,
            "email": SETUP_EMAIL,
            "password": SETUP_PASSWORD,
        },
        "prefs": {
            "site_name": SITE_NAME,
            "allow_tracking": False,
        },
    }
    r = sess.post(f"{MB_URL}/api/setup", json=body, timeout=120)
    if not r.ok:
        print(f"POST /api/setup failed: {r.status_code} {r.text[:800]}", file=sys.stderr)
        sys.exit(1)
    data = r.json()
    token = data.get("id")
    if token:
        print("Setup Metabase terminé (compte admin créé).")
        return token
    # Certaines versions renvoient la session ailleurs
    r2 = sess.post(
        f"{MB_URL}/api/session",
        json={"username": SETUP_EMAIL, "password": SETUP_PASSWORD},
        timeout=60,
    )
    r2.raise_for_status()
    return r2.json()["id"]


def mb_headers(session_id: str) -> dict:
    return {
        "X-Metabase-Session": session_id,
        "Content-Type": "application/json",
    }


def list_dashboards(sess: requests.Session, session_id: str) -> list[dict]:
    r = sess.get(f"{MB_URL}/api/dashboard", headers=mb_headers(session_id), timeout=60)
    r.raise_for_status()
    return as_item_list(r.json())


def find_dashboard(sess: requests.Session, session_id: str, name: str) -> int | None:
    for d in list_dashboards(sess, session_id):
        if d.get("name") == name:
            return d.get("id")
    return None


def list_databases(sess: requests.Session, session_id: str) -> list[dict]:
    r = sess.get(f"{MB_URL}/api/database", headers=mb_headers(session_id), timeout=60)
    r.raise_for_status()
    return as_item_list(r.json())


def ensure_database(sess: requests.Session, session_id: str, dbname: str) -> int:
    dbs = list_databases(sess, session_id)
    display = f"Find-Me | {dbname}"
    for row in dbs:
        if row.get("name") == display and row.get("engine") == "mysql":
            return row["id"]
    payload = {
        "engine": "mysql",
        "name": display,
        "details": {
            "host": MYSQL_HOST,
            "port": MYSQL_PORT,
            "dbname": dbname,
            "user": MYSQL_USER,
            "password": MYSQL_PASSWORD,
            "ssl": False,
            "tunnel-enabled": False,
            "additional-options": "allowPublicKeyRetrieval=true",
        },
        "is_full_sync": False,
        "is_on_demand": False,
    }
    r = sess.post(
        f"{MB_URL}/api/database",
        headers=mb_headers(session_id),
        data=json.dumps(payload),
        timeout=120,
    )
    if not r.ok:
        print(f"Création base {dbname}: {r.status_code} {r.text[:600]}", file=sys.stderr)
        sys.exit(1)
    return r.json()["id"]


def ensure_collection(sess: requests.Session, session_id: str) -> int:
    r2 = sess.get(f"{MB_URL}/api/collection", headers=mb_headers(session_id), timeout=60)
    r2.raise_for_status()
    for c in as_item_list(r2.json()):
        if c.get("name") == COLLECTION_NAME:
            return c["id"]
    payload = {
        "name": COLLECTION_NAME,
        "color": "#5A3FC9",
    }
    cr = sess.post(
        f"{MB_URL}/api/collection",
        headers=mb_headers(session_id),
        data=json.dumps(payload),
        timeout=60,
    )
    if not cr.ok:
        print(f"Collection: {cr.status_code} {cr.text[:500]}", file=sys.stderr)
        sys.exit(1)
    return cr.json()["id"]


def read_sql(rel: str) -> str:
    path = SQL_ROOT / rel
    if not path.is_file():
        print(f"ERREUR: fichier SQL manquant: {path}", file=sys.stderr)
        sys.exit(1)
    return path.read_text(encoding="utf-8")


def create_native_card(
    sess: requests.Session,
    session_id: str,
    database_id: int,
    collection_id: int,
    name: str,
    sql: str,
    display: str,
) -> int:
    payload = {
        "name": name,
        "description": "Généré automatiquement — Find-Me BI",
        "collection_id": collection_id,
        "dataset_query": {
            "type": "native",
            "database": database_id,
            "native": {"query": sql.strip(), "template-tags": {}},
        },
        "display": display,
        "visualization_settings": {},
    }
    r = sess.post(
        f"{MB_URL}/api/card",
        headers=mb_headers(session_id),
        data=json.dumps(payload),
        timeout=120,
    )
    if not r.ok:
        print(f"Carte '{name}': {r.status_code} {r.text[:700]}", file=sys.stderr)
        sys.exit(1)
    return r.json()["id"]


def create_dashboard(sess: requests.Session, session_id: str, collection_id: int) -> int:
    payload = {
        "name": DASHBOARD_NAME,
        "description": "Analyse BI Find-Me (utilisateurs, missions, CV, quiz, codingame).",
        "collection_id": collection_id,
        "parameters": [],
    }
    r = sess.post(
        f"{MB_URL}/api/dashboard",
        headers=mb_headers(session_id),
        data=json.dumps(payload),
        timeout=60,
    )
    if not r.ok:
        print(f"Dashboard: {r.status_code} {r.text[:500]}", file=sys.stderr)
        sys.exit(1)
    return r.json()["id"]


def add_card_to_dashboard(
    sess: requests.Session,
    session_id: str,
    dashboard_id: int,
    card_id: int,
    row: int,
    col: int,
    size_x: int,
    size_y: int,
) -> None:
    body = {"cardId": card_id, "row": row, "col": col, "sizeX": size_x, "sizeY": size_y}
    r = sess.post(
        f"{MB_URL}/api/dashboard/{dashboard_id}/cards",
        headers=mb_headers(session_id),
        data=json.dumps(body),
        timeout=60,
    )
    if not r.ok:
        print(
            f"Ajout carte {card_id} au dashboard: {r.status_code} {r.text[:600]}",
            file=sys.stderr,
        )
        sys.exit(1)


def main() -> None:
    sess = requests.Session()
    wait_for_metabase(sess)
    time.sleep(3)

    props = get_session_properties(sess)
    session_id = ensure_setup(sess, props)

    existing = find_dashboard(sess, session_id, DASHBOARD_NAME)
    if existing:
        print(f"Dashboard « {DASHBOARD_NAME} » déjà présent (id={existing}). Rien à faire.")
        print(f"Connexion Metabase : {SETUP_EMAIL}")
        return

    db_ids: dict[str, int] = {}
    for dbn in DB_NAMES:
        db_ids[dbn] = ensure_database(sess, session_id, dbn)
        time.sleep(1)

    collection_id = ensure_collection(sess, session_id)

    card_ids: list[int] = []
    for rel, db_key, title, display in CARDS:
        sql = read_sql(rel)
        cid = create_native_card(
            sess,
            session_id,
            db_ids[db_key],
            collection_id,
            title,
            sql,
            display,
        )
        card_ids.append(cid)
        time.sleep(0.3)

    dash_id = create_dashboard(sess, session_id, collection_id)
    cols, sx, sy = 3, 6, 4
    for i, cid in enumerate(card_ids):
        row = (i // cols) * sy
        col = (i % cols) * sx
        add_card_to_dashboard(sess, session_id, dash_id, cid, row, col, sx, sy)

    ext_url = os.environ.get("METABASE_EXTERNAL_URL", "http://localhost:3030")
    print("—" * 50)
    print("BI Metabase : provisionnement terminé.")
    print(f"  Ouvre dans le navigateur : {ext_url}")
    print(f"  Email admin : {SETUP_EMAIL}")
    print("  Mot de passe : celui défini par METABASE_SETUP_PASSWORD (voir docker-compose).")
    print(f"  Tableau de bord : {DASHBOARD_NAME} (collection « {COLLECTION_NAME} »)")
    print("—" * 50)


if __name__ == "__main__":
    main()
