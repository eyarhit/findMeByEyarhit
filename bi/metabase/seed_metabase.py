#!/usr/bin/env python3
"""
Provisionnement Metabase Find-Me : admin, bases MySQL, questions SQL natives,
tableau de bord, manifest JSON pour l'admin Angular.
"""
from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

MB_URL = os.environ.get("METABASE_URL", "http://metabase:3000").rstrip("/")
MB_EXTERNAL = os.environ.get("METABASE_EXTERNAL_URL", "http://localhost:3030").rstrip("/")
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
USE_STAR_SCHEMA = os.environ.get("BI_USE_STAR_SCHEMA", "true").lower() in (
    "1",
    "true",
    "yes",
)
DASHBOARD_NAME = (
    "Find-Me — Entrepôt décisionnel"
    if USE_STAR_SCHEMA
    else "Find-Me — BI complet"
)
# Bloc 5 — trois niveaux décisionnels (RH & Opérations)
DASHBOARD_TIERS: list[dict] = [
    {
        "level": "executive",
        "name": "Find-Me — BI Executive",
        "description": "Synthèse direction : KPIs globaux et tendances.",
        "slugs": [
            "executive_kpis",
            "users_by_role",
            "applications_by_month",
            "application_conversion_rate",
            "missions_by_month",
            "cvs_by_month",
        ],
    },
    {
        "level": "managerial",
        "name": "Find-Me — BI Managérial",
        "description": "Pilotage RH / ESN : missions, candidatures, profils.",
        "slugs": [
            "users_by_status",
            "users_by_country",
            "missions_by_status",
            "applications_by_status",
            "missions_by_contract",
            "missions_top_cities",
            "top_missions_applications",
            "missions_remote_split",
            "favorites_by_user_type",
            "cv_top_skills",
            "quiz_pass_fail",
        ],
    },
    {
        "level": "operational",
        "name": "Find-Me — BI Opérationnel",
        "description": "Détail opérationnel : notifications, CV, évaluations.",
        "slugs": [
            "notifications_by_month",
            "cv_completion_steps",
            "quiz_avg_score",
            "codingame_sessions_month",
            "codingame_avg_score",
            "codingame_score_by_framework",
        ],
    },
]
MANIFEST_PATH = Path(os.environ.get("BI_MANIFEST_PATH", "/output/bi-manifest.json"))

SQL_ROOT = Path(__file__).resolve().parent / "sql"

# (fichier dw/, titre, display, slug, domain, niveau dashboard)
_DW_SPECS: list[tuple[str, str, str, str, str, str]] = [
    ("01_utilisateurs_par_role.sql", "Utilisateurs par rôle", "bar", "users_by_role", "users", "executive"),
    ("02_utilisateurs_par_statut.sql", "Utilisateurs par statut", "pie", "users_by_status", "users", "managerial"),
    ("03_utilisateurs_par_pays.sql", "Utilisateurs par pays", "bar", "users_by_country", "users", "managerial"),
    ("04_notifications_par_mois.sql", "Notifications par mois", "line", "notifications_by_month", "users", "operational"),
    ("05_kpi_executif.sql", "KPI — vue exécutive", "table", "executive_kpis", "overview", "executive"),
    ("06_missions_par_statut.sql", "Missions par statut", "pie", "missions_by_status", "missions", "managerial"),
    ("07_missions_par_mois.sql", "Missions créées par mois", "line", "missions_by_month", "missions", "executive"),
    ("08_candidatures_par_statut.sql", "Candidatures par statut", "bar", "applications_by_status", "missions", "managerial"),
    ("09_type_contrat.sql", "Missions par type de contrat", "bar", "missions_by_contract", "missions", "managerial"),
    ("10_top_villes.sql", "Top villes (missions)", "bar", "missions_top_cities", "missions", "managerial"),
    ("11_favoris_par_user_type.sql", "Favoris par type utilisateur", "bar", "favorites_by_user_type", "missions", "managerial"),
    ("12_candidatures_par_mois.sql", "Candidatures par mois", "line", "applications_by_month", "missions", "executive"),
    ("13_taux_conversion_candidatures.sql", "Taux de conversion candidatures", "pie", "application_conversion_rate", "missions", "executive"),
    ("14_top_missions_candidatures.sql", "Top missions (candidatures)", "bar", "top_missions_applications", "missions", "managerial"),
    ("15_missions_teletravail.sql", "Missions télétravail vs sur site", "pie", "missions_remote_split", "missions", "managerial"),
    ("16_cv_par_mois.sql", "CV créés par mois", "line", "cvs_by_month", "cv", "executive"),
    ("17_top_competences.sql", "Top compétences CV", "bar", "cv_top_skills", "cv", "managerial"),
    ("18_cv_etapes_completees.sql", "CV — étapes complétées", "bar", "cv_completion_steps", "cv", "operational"),
    ("19_quiz_reussite.sql", "Quiz — réussite / échec", "pie", "quiz_pass_fail", "evaluations", "managerial"),
    ("20_score_moyen_quiz.sql", "Quiz — score moyen", "table", "quiz_avg_score", "evaluations", "operational"),
    ("21_codingame_sessions_mois.sql", "Codingame — sessions par mois", "line", "codingame_sessions_month", "evaluations", "operational"),
    ("22_codingame_score_moyen.sql", "Codingame — score moyen global", "table", "codingame_avg_score", "evaluations", "operational"),
    ("23_codingame_par_framework.sql", "Codingame — score par framework", "bar", "codingame_score_by_framework", "evaluations", "operational"),
]


def _dw_cards() -> list[dict]:
    return [
        {
            "file": f"dw/{fname}",
            "db": "findme_dw",
            "title": title,
            "display": display,
            "slug": slug,
            "domain": domain,
            "tier": tier,
        }
        for fname, title, display, slug, domain, tier in _DW_SPECS
    ]


# slug : identifiant stable pour le front | domain : onglet admin
_LEGACY_CARDS: list[dict] = [
    {
        "file": "user_bd/01_utilisateurs_par_role.sql",
        "db": "user_bd",
        "title": "Utilisateurs par rôle",
        "display": "bar",
        "slug": "users_by_role",
        "domain": "users",
    },
    {
        "file": "user_bd/02_utilisateurs_par_statut.sql",
        "db": "user_bd",
        "title": "Utilisateurs par statut",
        "display": "pie",
        "slug": "users_by_status",
        "domain": "users",
    },
    {
        "file": "user_bd/03_utilisateurs_par_pays.sql",
        "db": "user_bd",
        "title": "Utilisateurs par pays",
        "display": "bar",
        "slug": "users_by_country",
        "domain": "users",
    },
    {
        "file": "user_bd/04_notifications_par_mois.sql",
        "db": "user_bd",
        "title": "Notifications par mois",
        "display": "line",
        "slug": "notifications_by_month",
        "domain": "users",
    },
    {
        "file": "user_bd/05_kpi_executif.sql",
        "db": "user_bd",
        "title": "KPI — vue exécutive",
        "display": "table",
        "slug": "executive_kpis",
        "domain": "overview",
    },
    {
        "file": "mission_bd/01_missions_par_statut.sql",
        "db": "mission_bd",
        "title": "Missions par statut",
        "display": "pie",
        "slug": "missions_by_status",
        "domain": "missions",
    },
    {
        "file": "mission_bd/02_missions_par_mois.sql",
        "db": "mission_bd",
        "title": "Missions créées par mois",
        "display": "line",
        "slug": "missions_by_month",
        "domain": "missions",
    },
    {
        "file": "mission_bd/03_candidatures_par_statut.sql",
        "db": "mission_bd",
        "title": "Candidatures par statut",
        "display": "bar",
        "slug": "applications_by_status",
        "domain": "missions",
    },
    {
        "file": "mission_bd/04_type_contrat.sql",
        "db": "mission_bd",
        "title": "Missions par type de contrat",
        "display": "bar",
        "slug": "missions_by_contract",
        "domain": "missions",
    },
    {
        "file": "mission_bd/05_top_villes.sql",
        "db": "mission_bd",
        "title": "Top villes (missions)",
        "display": "bar",
        "slug": "missions_top_cities",
        "domain": "missions",
    },
    {
        "file": "mission_bd/06_favoris_par_user_type.sql",
        "db": "mission_bd",
        "title": "Favoris par type utilisateur",
        "display": "bar",
        "slug": "favorites_by_user_type",
        "domain": "missions",
    },
    {
        "file": "mission_bd/07_candidatures_par_mois.sql",
        "db": "mission_bd",
        "title": "Candidatures par mois",
        "display": "line",
        "slug": "applications_by_month",
        "domain": "missions",
    },
    {
        "file": "mission_bd/08_taux_conversion_candidatures.sql",
        "db": "mission_bd",
        "title": "Taux de conversion candidatures",
        "display": "pie",
        "slug": "application_conversion_rate",
        "domain": "missions",
    },
    {
        "file": "mission_bd/09_top_missions_candidatures.sql",
        "db": "mission_bd",
        "title": "Top missions (candidatures)",
        "display": "bar",
        "slug": "top_missions_applications",
        "domain": "missions",
    },
    {
        "file": "mission_bd/10_missions_teletravail.sql",
        "db": "mission_bd",
        "title": "Missions télétravail vs sur site",
        "display": "pie",
        "slug": "missions_remote_split",
        "domain": "missions",
    },
    {
        "file": "cv_bd/01_cv_par_mois.sql",
        "db": "cv_bd",
        "title": "CV créés par mois",
        "display": "line",
        "slug": "cvs_by_month",
        "domain": "cv",
    },
    {
        "file": "cv_bd/02_top_competences.sql",
        "db": "cv_bd",
        "title": "Top compétences CV",
        "display": "bar",
        "slug": "cv_top_skills",
        "domain": "cv",
    },
    {
        "file": "cv_bd/03_cv_etapes_completees.sql",
        "db": "cv_bd",
        "title": "CV — étapes complétées",
        "display": "bar",
        "slug": "cv_completion_steps",
        "domain": "cv",
    },
    {
        "file": "quiz_bd/01_quiz_reussite.sql",
        "db": "quiz_bd",
        "title": "Quiz — réussite / échec",
        "display": "pie",
        "slug": "quiz_pass_fail",
        "domain": "evaluations",
    },
    {
        "file": "quiz_bd/02_score_moyen_quiz.sql",
        "db": "quiz_bd",
        "title": "Quiz — score moyen",
        "display": "table",
        "slug": "quiz_avg_score",
        "domain": "evaluations",
    },
    {
        "file": "codingame_bd/01_sessions_par_mois.sql",
        "db": "codingame_bd",
        "title": "Codingame — sessions par mois",
        "display": "line",
        "slug": "codingame_sessions_month",
        "domain": "evaluations",
    },
    {
        "file": "codingame_bd/02_score_moyen.sql",
        "db": "codingame_bd",
        "title": "Codingame — score moyen global",
        "display": "table",
        "slug": "codingame_avg_score",
        "domain": "evaluations",
    },
    {
        "file": "codingame_bd/03_scores_par_framework.sql",
        "db": "codingame_bd",
        "title": "Codingame — score par framework",
        "display": "bar",
        "slug": "codingame_score_by_framework",
        "domain": "evaluations",
    },
]

CARDS: list[dict] = _dw_cards() if USE_STAR_SCHEMA else _LEGACY_CARDS
DB_NAMES: list[str] = (
    ["findme_dw"] if USE_STAR_SCHEMA else ["user_bd", "mission_bd", "cv_bd", "quiz_bd", "codingame_bd"]
)

TAB_LABELS = {
    "overview": "Vue d'ensemble",
    "users": "Utilisateurs & engagement",
    "missions": "Missions & candidatures",
    "cv": "CV & compétences",
    "evaluations": "Quiz & Codingame",
}


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


def _truthy(val) -> bool:
    return val in (True, "true", "TRUE", 1, "1")


def wait_for_metabase(sess: requests.Session) -> None:
    for i in range(120):
        try:
            r = sess.get(f"{MB_URL}/api/health", timeout=5)
            if r.ok and r.json().get("status") == "ok":
                print("Metabase: /api/health OK")
                return
        except requests.RequestException:
            pass
        time.sleep(2)
        if i % 10 == 0:
            print(f"… attente Metabase ({i * 2}s)")
    print("ERREUR: Metabase ne répond pas", file=sys.stderr)
    sys.exit(1)


def get_session_properties(sess: requests.Session) -> dict:
    r = sess.get(f"{MB_URL}/api/session/properties", timeout=30)
    r.raise_for_status()
    return r.json()


def ensure_setup(sess: requests.Session, props: dict) -> str:
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
            print(r.text[:500], file=sys.stderr)
            sys.exit(1)
        token = r.json().get("id")
        if not token:
            sys.exit(1)
        return token

    if not setup_token:
        print("ERREUR: setup-token manquant", file=sys.stderr)
        sys.exit(1)

    body = {
        "token": setup_token,
        "user": {
            "first_name": SETUP_FIRST,
            "last_name": SETUP_LAST,
            "email": SETUP_EMAIL,
            "password": SETUP_PASSWORD,
        },
        "prefs": {"site_name": SITE_NAME, "allow_tracking": False},
    }
    r = sess.post(f"{MB_URL}/api/setup", json=body, timeout=120)
    if not r.ok:
        print(f"POST /api/setup failed: {r.status_code}", file=sys.stderr)
        sys.exit(1)
    token = r.json().get("id")
    if token:
        print("Setup Metabase terminé.")
        return token
    r2 = sess.post(
        f"{MB_URL}/api/session",
        json={"username": SETUP_EMAIL, "password": SETUP_PASSWORD},
        timeout=60,
    )
    r2.raise_for_status()
    return r2.json()["id"]


def mb_headers(session_id: str) -> dict:
    return {"X-Metabase-Session": session_id, "Content-Type": "application/json"}


def list_dashboards(sess: requests.Session, session_id: str) -> list[dict]:
    r = sess.get(f"{MB_URL}/api/dashboard", headers=mb_headers(session_id), timeout=60)
    r.raise_for_status()
    return as_item_list(r.json())


def find_dashboard(sess: requests.Session, session_id: str, name: str) -> int | None:
    for d in list_dashboards(sess, session_id):
        if d.get("name") == name:
            return d.get("id")
    return None


def get_dashboard(sess: requests.Session, session_id: str, dash_id: int) -> dict:
    r = sess.get(
        f"{MB_URL}/api/dashboard/{dash_id}",
        headers=mb_headers(session_id),
        timeout=60,
    )
    r.raise_for_status()
    return r.json()


def list_cards(sess: requests.Session, session_id: str) -> list[dict]:
    r = sess.get(f"{MB_URL}/api/card", headers=mb_headers(session_id), timeout=120)
    r.raise_for_status()
    return as_item_list(r.json())


def list_databases(sess: requests.Session, session_id: str) -> list[dict]:
    r = sess.get(f"{MB_URL}/api/database", headers=mb_headers(session_id), timeout=60)
    r.raise_for_status()
    return as_item_list(r.json())


def ensure_database(sess: requests.Session, session_id: str, dbname: str) -> int:
    display = (
        "Find-Me | Entrepôt décisionnel (findme_dw)"
        if dbname == "findme_dw"
        else f"Find-Me | {dbname}"
    )
    for row in list_databases(sess, session_id):
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
    cr = sess.post(
        f"{MB_URL}/api/collection",
        headers=mb_headers(session_id),
        data=json.dumps({"name": COLLECTION_NAME, "color": "#5A3FC9"}),
        timeout=60,
    )
    cr.raise_for_status()
    return cr.json()["id"]


def read_sql(rel: str) -> str:
    path = SQL_ROOT / rel
    if not path.is_file():
        print(f"ERREUR: SQL manquant: {path}", file=sys.stderr)
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
        "description": (
            "Find-Me BI — entrepôt findme_dw (schéma en étoile)"
            if USE_STAR_SCHEMA
            else "Find-Me BI — aligné sur le schéma Hibernate / microservices"
        ),
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
        "description": (
            "Entrepôt décisionnel findme_dw (dimensions + faits) — pilotage Find-Me."
            if USE_STAR_SCHEMA
            else "Pilotage Find-Me : utilisateurs, missions, CV, quiz, Codingame."
        ),
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
        print(f"Ajout carte {card_id}: {r.status_code} {r.text[:600]}", file=sys.stderr)
        sys.exit(1)


def build_tabs(card_entries: list[dict]) -> list[dict]:
    domains: list[str] = []
    for c in card_entries:
        d = c.get("domain", "other")
        if d not in domains:
            domains.append(d)
    tabs = []
    for domain in domains:
        slugs = [c["slug"] for c in card_entries if c.get("domain") == domain]
        tabs.append(
            {
                "key": domain,
                "label": TAB_LABELS.get(domain, domain.replace("_", " ").title()),
                "cardSlugs": slugs,
            }
        )
    return tabs


def write_manifest(
    dash_id: int,
    card_entries: list[dict],
    dashboards: list[dict] | None = None,
) -> None:
    tier_dashboards = dashboards or []
    primary = tier_dashboards[0] if tier_dashboards else {
        "id": dash_id,
        "level": "executive",
        "name": DASHBOARD_NAME,
        "url": f"{MB_EXTERNAL}/dashboard/{dash_id}",
    }
    manifest = {
        "version": 3,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "metabaseUrl": MB_EXTERNAL,
        "dashboard": {
            "id": primary.get("id", dash_id),
            "name": primary.get("name", DASHBOARD_NAME),
            "url": primary.get("url", f"{MB_EXTERNAL}/dashboard/{dash_id}"),
        },
        "dashboards": tier_dashboards,
        "cards": card_entries,
        "tabs": build_tabs(card_entries),
        "credentials": {
            "metabaseAdminEmail": SETUP_EMAIL,
            "mysqlReadOnlyUser": MYSQL_USER,
        },
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Manifest BI écrit : {MANIFEST_PATH}")


def manifest_from_existing_dashboard(
    sess: requests.Session, session_id: str, dash_id: int
) -> list[dict]:
    """Reconstruit le manifest à partir du dashboard Metabase existant."""
    dash = get_dashboard(sess, session_id, dash_id)
    title_to_meta = {c["title"]: c for c in CARDS}
    all_cards = {c.get("id"): c for c in list_cards(sess, session_id)}
    entries: list[dict] = []
    seen: set[int] = set()

    for dc in dash.get("ordered_cards") or dash.get("dashcards") or []:
        card_id = dc.get("card_id") or (dc.get("card") or {}).get("id")
        if not card_id or card_id in seen:
            continue
        seen.add(card_id)
        card = all_cards.get(card_id) or {}
        title = card.get("name") or f"Carte {card_id}"
        meta = title_to_meta.get(title, {})
        entries.append(
            {
                "id": card_id,
                "slug": meta.get("slug", f"card_{card_id}"),
                "title": title,
                "domain": meta.get("domain", "other"),
                "display": meta.get("display", card.get("display", "table")),
                "db": meta.get("db", ""),
                "url": f"{MB_EXTERNAL}/question/{card_id}",
            }
        )

    if not entries:
        for c in CARDS:
            for card in all_cards.values():
                if card.get("name") == c["title"]:
                    entries.append(
                        {
                            "id": card["id"],
                            "slug": c["slug"],
                            "title": c["title"],
                            "domain": c["domain"],
                            "display": c["display"],
                            "db": c["db"],
                            "url": f"{MB_EXTERNAL}/question/{card['id']}",
                        }
                    )
                    break
    return entries


def _slug_to_entry(card_entries: list[dict]) -> dict[str, dict]:
    return {e["slug"]: e for e in card_entries}


def provision_fresh(sess: requests.Session, session_id: str) -> tuple[int, list[dict], list[dict]]:
    db_ids = {dbn: ensure_database(sess, session_id, dbn) for dbn in DB_NAMES}
    collection_id = ensure_collection(sess, session_id)

    card_entries: list[dict] = []
    for spec in CARDS:
        sql = read_sql(spec["file"])
        cid = create_native_card(
            sess,
            session_id,
            db_ids[spec["db"]],
            collection_id,
            spec["title"],
            sql,
            spec["display"],
        )
        card_entries.append(
            {
                "id": cid,
                "slug": spec["slug"],
                "title": spec["title"],
                "domain": spec["domain"],
                "display": spec["display"],
                "db": spec["db"],
                "tier": spec.get("tier", "managerial"),
                "url": f"{MB_EXTERNAL}/question/{cid}",
            }
        )
        time.sleep(0.25)

    by_slug = _slug_to_entry(card_entries)
    tier_dashboards: list[dict] = []
    cols, sx, sy = 2, 6, 4

    tiers = DASHBOARD_TIERS if USE_STAR_SCHEMA else [
        {"level": "complete", "name": DASHBOARD_NAME, "description": DASHBOARD_NAME, "slugs": [e["slug"] for e in card_entries]},
    ]

    for tier_cfg in tiers:
        payload = {
            "name": tier_cfg["name"],
            "description": tier_cfg.get("description", ""),
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
            print(f"Dashboard {tier_cfg['name']}: {r.status_code}", file=sys.stderr)
            sys.exit(1)
        dash_id = r.json()["id"]
        subset = [by_slug[s] for s in tier_cfg["slugs"] if s in by_slug]
        for i, entry in enumerate(subset):
            row = (i // cols) * sy
            col = (i % cols) * sx
            add_card_to_dashboard(sess, session_id, dash_id, entry["id"], row, col, sx, sy)
            time.sleep(0.15)
        tier_dashboards.append(
            {
                "id": dash_id,
                "level": tier_cfg["level"],
                "name": tier_cfg["name"],
                "url": f"{MB_EXTERNAL}/dashboard/{dash_id}",
                "cardSlugs": [e["slug"] for e in subset],
            }
        )
        print(f"Dashboard « {tier_cfg['name']} » id={dash_id} ({len(subset)} cartes)")

    primary_id = tier_dashboards[0]["id"] if tier_dashboards else 0
    return primary_id, card_entries, tier_dashboards


def find_existing_tier_dashboards(sess: requests.Session, session_id: str) -> list[dict]:
    names = {t["name"] for t in DASHBOARD_TIERS} if USE_STAR_SCHEMA else {DASHBOARD_NAME}
    found = []
    for d in list_dashboards(sess, session_id):
        if d.get("name") in names:
            found.append(
                {
                    "id": d["id"],
                    "level": next(
                        (t["level"] for t in DASHBOARD_TIERS if t["name"] == d.get("name")),
                        "complete",
                    ),
                    "name": d.get("name"),
                    "url": f"{MB_EXTERNAL}/dashboard/{d['id']}",
                }
            )
    return found


def main() -> None:
    sess = requests.Session()
    wait_for_metabase(sess)
    time.sleep(2)

    props = get_session_properties(sess)
    session_id = ensure_setup(sess, props)

    existing_tiers = find_existing_tier_dashboards(sess, session_id)
    if existing_tiers:
        print(f"Dashboards BI déjà présents ({len(existing_tiers)}).")
        primary = existing_tiers[0]["id"]
        entries = manifest_from_existing_dashboard(sess, session_id, primary)
        write_manifest(primary, entries, existing_tiers)
        print(f"Metabase : {MB_EXTERNAL} — {SETUP_EMAIL}")
        return

    dash_id, entries, tier_dashboards = provision_fresh(sess, session_id)
    write_manifest(dash_id, entries, tier_dashboards)

    print("—" * 50)
    print("BI Metabase : provisionnement terminé.")
    print(f"  URL : {MB_EXTERNAL}")
    print(f"  Dashboards : {len(tier_dashboards)}")
    print(f"  Cartes : {len(entries)}")
    print("—" * 50)


if __name__ == "__main__":
    main()
