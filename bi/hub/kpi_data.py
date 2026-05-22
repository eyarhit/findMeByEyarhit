"""Exécution des requêtes KPI SQL et format pour l'admin Angular."""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Callable

KPI_SQL_DIR = Path(os.environ.get("KPI_SQL_DIR", "/app/kpis/sql"))
MANIFEST_PATH = Path(os.environ.get("BI_MANIFEST_PATH", "/app/bi-manifest.json"))

PAGE_SLUGS: dict[str, list[str]] = {
    "executive": [
        "executive_kpis",
        "users_by_role",
        "applications_by_month",
        "application_conversion_rate",
        "missions_by_month",
        "cvs_by_month",
    ],
    "managerial": [
        "users_by_status",
        "users_by_country",
        "missions_by_status",
        "applications_by_status",
        "missions_by_contract",
        "missions_top_cities",
        "top_missions_applications",
        "missions_remote_split",
        "favorites_by_user_type",
        "quiz_pass_fail",
    ],
    "operational": [
        "notifications_by_month",
        "cv_steps_completed",
        "cv_top_skills",
        "codingame_sessions",
        "codingame_avg_score",
        "codingame_by_framework",
    ],
    "technique": [
        "quiz_avg_score",
        "quiz_pass_fail",
        "codingame_by_framework",
        "codingame_sessions_month",
    ],
}

SLUG_SQL_LEGACY: dict[str, str] = {
    "executive_kpis": "05_kpi_executif.sql",
    "users_by_role": "01_utilisateurs_par_role.sql",
    "applications_by_month": "12_candidatures_par_mois.sql",
    "application_conversion_rate": "13_taux_conversion_candidatures.sql",
    "missions_by_month": "07_missions_par_mois.sql",
    "cvs_by_month": "16_cv_par_mois.sql",
    "users_by_status": "02_utilisateurs_par_statut.sql",
    "users_by_country": "03_utilisateurs_par_pays.sql",
    "missions_by_status": "06_missions_par_statut.sql",
    "applications_by_status": "08_candidatures_par_statut.sql",
    "missions_by_contract": "09_type_contrat.sql",
    "missions_top_cities": "10_top_villes.sql",
    "top_missions_applications": "14_top_missions_candidatures.sql",
    "missions_remote_split": "15_missions_teletravail.sql",
    "favorites_by_user_type": "11_favoris_par_user_type.sql",
    "quiz_pass_fail": "19_quiz_reussite.sql",
    "notifications_by_month": "04_notifications_par_mois.sql",
    "cv_steps_completed": "18_cv_etapes_completees.sql",
    "cv_top_skills": "17_top_competences.sql",
    "codingame_sessions": "21_codingame_sessions_mois.sql",
    "codingame_avg_score": "22_codingame_score_moyen.sql",
    "codingame_by_framework": "23_codingame_par_framework.sql",
    "quiz_avg_score": "20_score_moyen_quiz.sql",
    "codingame_sessions_month": "21_codingame_sessions_mois.sql",
}


def _manifest_data() -> dict[str, Any]:
    if MANIFEST_PATH.is_file():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {}


def card_display(slug: str) -> str:
    for c in _manifest_data().get("cards") or []:
        if c.get("slug") == slug:
            return str(c.get("display") or "")
    return ""


def page_slugs(level: str) -> list[str]:
    tabs = _manifest_data().get("tabs") or []
    for t in tabs:
        if t.get("key") == level:
            return list(t.get("cardSlugs") or [])
    return PAGE_SLUGS.get(level, [])


def slug_sql_file(slug: str) -> str | None:
    for c in _manifest_data().get("cards") or []:
        if c.get("slug") == slug:
            sf = c.get("sqlFile") or ""
            if sf:
                return Path(sf).name
    return SLUG_SQL_LEGACY.get(slug)


def _strip_sql_comments(sql: str) -> str:
    lines = []
    for line in sql.splitlines():
        if line.strip().startswith("--"):
            continue
        lines.append(line)
    return "\n".join(lines).strip()


def _to_number(v: Any) -> float:
    if v is None:
        return 0.0
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def _conversion_gauge(rows: list[dict[str, Any]]) -> dict[str, Any]:
    total = sum(_to_number(r.get("nombre") or r.get("NOMBRE")) for r in rows)
    accepted = 0.0
    for r in rows:
        statut = str(r.get("statut") or r.get("STATUT") or "").upper()
        if "ACCEP" in statut or "VALID" in statut or "RETENU" in statut:
            accepted += _to_number(r.get("nombre") or r.get("NOMBRE"))
    rate = round(100.0 * accepted / total, 1) if total else 0.0
    points = [
        {
            "label": str(r.get("statut") or r.get("STATUT") or "?"),
            "value": _to_number(r.get("nombre") or r.get("NOMBRE")),
        }
        for r in rows
    ]
    return {
        "kind": "gauge",
        "points": points,
        "scalars": {},
        "scalar": rate,
    }


def shape_result(
    rows: list[dict[str, Any]], columns: list[str], display: str = "", slug: str = ""
) -> dict[str, Any]:
    if not rows:
        return {"kind": "empty", "points": [], "scalars": {}, "scalar": None}

    if slug == "application_conversion_rate":
        return _conversion_gauge(rows)

    disp = (display or "").lower()
    if len(rows) == 1 and len(columns) > 2:
        scalars = {str(k): _to_number(rows[0].get(k)) for k in columns}
        return {"kind": "matrix", "points": [], "scalars": scalars, "scalar": None}

    if "gauge" in disp and len(columns) >= 2:
        return _conversion_gauge(rows)

    if len(columns) == 1 and len(rows) == 1:
        return {
            "kind": "kpi",
            "points": [],
            "scalars": {},
            "scalar": _to_number(rows[0].get(columns[0])),
        }

    if len(columns) >= 2:
        label_col = columns[0]
        value_col = columns[1]
        for c in columns[1:]:
            cl = c.lower()
            if any(
                x in cl
                for x in (
                    "nombre",
                    "total",
                    "count",
                    "candidat",
                    "mission",
                    "score",
                    "session",
                    "tentative",
                    "cv",
                    "notif",
                    "moyen",
                )
            ):
                value_col = c
                break
        points = [
            {"label": str(r.get(label_col) or ""), "value": _to_number(r.get(value_col))}
            for r in rows
        ]
        kind = "line" if "line" in disp else "bar"
        if "donut" in disp or "pie" in disp:
            kind = "donut"
        return {"kind": kind, "points": points, "scalars": {}, "scalar": None}

    return {"kind": "table", "points": [], "scalars": {}, "scalar": None, "rows": rows[:20]}


def _execute_slug(conn: Any, slug: str) -> dict[str, Any]:
    display = card_display(slug)
    fname = slug_sql_file(slug)
    if not fname:
        return {"kind": "error", "error": "SQL inconnu", "points": [], "scalars": {}, "scalar": None, "slug": slug}
    path = KPI_SQL_DIR / fname
    if not path.is_file():
        return {
            "kind": "error",
            "error": f"Fichier absent: {fname}",
            "points": [],
            "scalars": {},
            "scalar": None,
            "slug": slug,
        }
    sql = _strip_sql_comments(path.read_text(encoding="utf-8"))
    if not sql:
        return {"kind": "error", "error": "SQL vide", "points": [], "scalars": {}, "scalar": None, "slug": slug}
    with conn.cursor() as cur:
        cur.execute(sql)
        rows = list(cur.fetchall() or [])
        cols = [d[0] for d in (cur.description or [])]
    if not cols and rows:
        cols = list(rows[0].keys())
    out = shape_result(rows, cols, display, slug)
    out["slug"] = slug
    return out


def run_slug_query(connect_fn: Callable[[], Any], slug: str) -> dict[str, Any]:
    try:
        with connect_fn() as conn:
            return _execute_slug(conn, slug)
    except Exception as exc:
        return {
            "kind": "error",
            "error": str(exc)[:200],
            "points": [],
            "scalars": {},
            "scalar": None,
            "slug": slug,
        }


def run_page_queries(connect_fn: Callable[[], Any], level: str) -> dict[str, dict[str, Any]]:
    """Une seule connexion MySQL pour toute la page (évite blocage / saturation)."""
    charts: dict[str, dict[str, Any]] = {}
    slugs = page_slugs(level)
    try:
        with connect_fn() as conn:
            for slug in slugs:
                try:
                    charts[slug] = _execute_slug(conn, slug)
                except Exception as exc:
                    charts[slug] = {
                        "kind": "error",
                        "error": str(exc)[:200],
                        "points": [],
                        "scalars": {},
                        "scalar": None,
                        "slug": slug,
                    }
    except Exception as exc:
        err = str(exc)[:200]
        for slug in slugs:
            charts[slug] = {
                "kind": "error",
                "error": err,
                "points": [],
                "scalars": {},
                "scalar": None,
                "slug": slug,
            }
    return charts
