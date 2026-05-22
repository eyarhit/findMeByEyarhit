"""Mesures alignées sur MesuresBI (Power BI) + filtres slicers."""
from __future__ import annotations

from typing import Any, Callable


def _year_clause(year: int | None, alias: str | None = "d") -> str:
    if year is None:
        return ""
    y = int(year)
    if alias:
        return f" AND {alias}.year_num = {y}"
    return f" AND year_num = {y}"


def _contract_clause(contract: str | None, column: str = "type_contrat") -> str:
    if not contract or contract in ("Tous", "(Tous)", "All"):
        return ""
    safe = contract.replace("'", "''")
    return f" AND {column} = '{safe}'"


def fetch_filter_options(connect_fn: Callable[[], Any]) -> dict[str, list]:
    out: dict[str, list] = {"years": [], "contracts": [], "roles": [], "countries": []}
    with connect_fn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DISTINCT year_num AS y FROM dim_date
                WHERE year_num > 1900 ORDER BY y DESC LIMIT 15
                """
            )
            out["years"] = [
                int(r.get("y") or r.get("Y") or 0)
                for r in cur.fetchall()
                if 2000 <= int(r.get("y") or r.get("Y") or 0) <= 2030
            ]
            cur.execute(
                """
                SELECT DISTINCT type_contrat AS c FROM dim_mission
                WHERE type_contrat IS NOT NULL AND type_contrat != ''
                ORDER BY c
                """
            )
            out["contracts"] = ["(Tous)"] + [
                str(r.get("c") or r.get("C") or "") for r in cur.fetchall()
            ]
            cur.execute(
                """
                SELECT DISTINCT role_name AS r FROM dim_user
                WHERE user_key > 0 ORDER BY r
                """
            )
            out["roles"] = ["(Tous)"] + [str(r.get("r") or r.get("R") or "") for r in cur.fetchall()]
            cur.execute(
                """
                SELECT DISTINCT country AS p FROM dim_user
                WHERE country IS NOT NULL AND country != '' ORDER BY p
                """
            )
            out["countries"] = ["(Tous)"] + [str(r.get("p") or r.get("P") or "") for r in cur.fetchall()]
    return out


def fetch_executive_measures(
    connect_fn: Callable[[], Any],
    year: int | None = None,
    contract: str | None = None,
) -> dict[str, float]:
    yk_view = _year_clause(year, None)
    yk = _year_clause(year, "d")
    ck = _contract_clause(contract)
    sql = f"""
    SELECT
      COALESCE(SUM(candidatures), 0) AS kpi_candidatures,
      COALESCE(SUM(acceptees), 0) AS kpi_acceptees,
      COALESCE(SUM(refusees), 0) AS kpi_refusees,
      COALESCE(ROUND(100.0 * SUM(acceptees) / NULLIF(SUM(candidatures), 0), 1), 0) AS kpi_taux_pct
    FROM v_bi_kpi_recrutement WHERE 1=1 {yk_view}
    """
    if year:
        sql_missions = f"""
        SELECT
          COALESCE(SUM(mission_count), 0) AS missions_vue,
          COALESCE(SUM(CASE WHEN status_mission = 'OPEN' THEN mission_count ELSE 0 END), 0) AS missions_ouvertes
        FROM v_bi_mission WHERE year_num = {int(year)} {ck}
        """
    else:
        sql_missions = f"""
        SELECT COALESCE(SUM(mission_count), 0) AS missions_vue,
          COALESCE(SUM(CASE WHEN status_mission = 'OPEN' THEN mission_count ELSE 0 END), 0) AS missions_ouvertes
        FROM v_bi_mission WHERE 1=1 {ck}
        """
    measures: dict[str, float] = {}
    with connect_fn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            row = cur.fetchone() or {}
            measures["KPI Candidatures"] = float(row.get("kpi_candidatures") or 0)
            measures["KPI Acceptees"] = float(row.get("kpi_acceptees") or 0)
            measures["KPI Refusees"] = float(row.get("kpi_refusees") or 0)
            measures["KPI Taux %"] = float(row.get("kpi_taux_pct") or 0)
            cur.execute(sql_missions)
            m = cur.fetchone() or {}
            measures["Missions (vue)"] = float(m.get("missions_vue") or 0)
            measures["Missions ouvertes"] = float(m.get("missions_ouvertes") or 0)
            cur.execute(
                f"""
                SELECT COALESCE(SUM(user_count),0) u, COALESCE(SUM(cv_count),0) cv
                FROM fact_user fu
                JOIN dim_date d ON d.date_key = fu.date_key
                WHERE fu.date_key > 19000101 {yk}
                """
            )
            u = cur.fetchone() or {}
            measures["Total utilisateurs"] = float(u.get("u") or 0)
            cur.execute(
                f"""
                SELECT COALESCE(SUM(cv_count),0) cv FROM fact_cv fc
                JOIN dim_date d ON d.date_key = fc.date_key
                WHERE fc.date_key > 19000101 {yk}
                """
            )
            cv = cur.fetchone() or {}
            measures["Total CV"] = float(cv.get("cv") or 0)
    return measures


def fetch_line_candidatures(connect_fn: Callable[[], Any], year: int | None) -> list[dict]:
    yk = _year_clause(year, "d")
    sql = f"""
    SELECT CONCAT(d.year_num, '-', LPAD(d.month_num, 2, '0')) AS label,
           SUM(fc.candidature_count) AS value
    FROM fact_candidature fc
    JOIN dim_date d ON d.date_key = fc.date_key
    WHERE fc.date_key > 19000101 {yk}
    GROUP BY d.year_num, d.month_num ORDER BY d.year_num, d.month_num
    """
    with connect_fn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()
    return [{"label": str(r.get("label") or ""), "value": float(r.get("value") or 0)} for r in rows]


def fetch_line_missions(connect_fn: Callable[[], Any], year: int | None) -> list[dict]:
    yk = _year_clause(year, "d")
    sql = f"""
    SELECT CONCAT(d.year_num, '-', LPAD(d.month_num, 2, '0')) AS label,
           SUM(fm.mission_count) AS value
    FROM fact_mission fm
    JOIN dim_date d ON d.date_key = fm.date_key
    WHERE fm.date_key > 19000101 {yk}
    GROUP BY d.year_num, d.month_num ORDER BY d.year_num, d.month_num
    """
    with connect_fn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()
    return [{"label": str(r.get("label") or ""), "value": float(r.get("value") or 0)} for r in rows]


def fetch_line_cv(connect_fn: Callable[[], Any], year: int | None) -> list[dict]:
    yk = _year_clause(year, "d")
    sql = f"""
    SELECT CONCAT(d.year_num, '-', LPAD(d.month_num, 2, '0')) AS label,
           COALESCE(SUM(fcv.cv_count), 0) AS value
    FROM dim_date d
    LEFT JOIN fact_cv fcv ON fcv.date_key = d.date_key
    WHERE d.date_key > 19000101 {yk}
    GROUP BY d.year_num, d.month_num
    ORDER BY d.year_num, d.month_num
    """
    with connect_fn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()
    return [{"label": str(r.get("label") or ""), "value": float(r.get("value") or 0)} for r in rows]


def fetch_donut_statut(connect_fn: Callable[[], Any], year: int | None) -> list[dict]:
    yk = _year_clause(year, "d")
    sql = f"""
    SELECT fc.statut_candidature AS label, SUM(fc.candidature_count) AS value
    FROM fact_candidature fc
    JOIN dim_date d ON d.date_key = fc.date_key
    WHERE fc.date_key > 19000101 {yk}
    GROUP BY fc.statut_candidature ORDER BY value DESC
    """
    with connect_fn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()
    return [{"label": str(r.get("label") or ""), "value": float(r.get("value") or 0)} for r in rows]


def fetch_top_missions(connect_fn: Callable[[], Any], year: int | None, limit: int = 8) -> list[dict]:
    yk = _year_clause(year, "d")
    sql = f"""
    SELECT dm.mission_name AS label, SUM(fc.candidature_count) AS value
    FROM fact_candidature fc
    JOIN dim_mission dm ON dm.mission_key = fc.mission_key
    JOIN dim_date d ON d.date_key = fc.date_key
    WHERE fc.date_key > 19000101 {yk}
    GROUP BY dm.mission_name ORDER BY value DESC LIMIT {int(limit)}
    """
    with connect_fn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()
    return [{"label": str(r.get("label") or "")[:40], "value": float(r.get("value") or 0)} for r in rows]


def visual_data_for_executive(
    connect_fn: Callable[[], Any],
    visual_id: str,
    year: int | None,
    contract: str | None,
    measures: dict[str, float],
) -> dict[str, Any]:
    mapping = {
        "kpi_acc": ("KPI Acceptees", "card"),
        "kpi_cand": ("KPI Candidatures", "card"),
        "kpi_ref": ("KPI Refusees", "card"),
        "kpi_tx": ("KPI Taux %", "card"),
        "kpi_open": ("Missions ouvertes", "card"),
        "kpi_mis": ("Missions (vue)", "card"),
    }
    if visual_id in mapping:
        key, kind = mapping[visual_id]
        val = measures.get(key, 0)
        suffix = "%" if visual_id == "kpi_tx" else ""
        return {"kind": "card", "scalar": val, "suffix": suffix, "points": []}
    if visual_id == "line_cand":
        pts = fetch_line_candidatures(connect_fn, year)
        return {"kind": "line", "points": pts, "scalar": None}
    if visual_id == "bar_month":
        pts = fetch_line_missions(connect_fn, year)
        return {"kind": "bar", "points": pts, "scalar": None}
    if visual_id in ("donut_acc", "donut_statut"):
        pts = fetch_donut_statut(connect_fn, year)
        return {"kind": "donut", "points": pts, "scalar": None}
    if visual_id == "bar_top_mission":
        pts = fetch_top_missions(connect_fn, year)
        return {"kind": "bar", "points": pts, "scalar": None}
    if visual_id == "tbl_kpi":
        return {"kind": "table", "rows": [{"indicateur": k, "valeur": v} for k, v in measures.items()]}
    if visual_id == "line_trend":
        return {"kind": "line", "points": fetch_line_candidatures(connect_fn, year), "scalar": None}
    if visual_id == "line_taux":
        return {"kind": "card", "scalar": measures.get("KPI Taux %", 0), "suffix": "%", "points": []}
    # CV par mois — même requête dédiée
    if visual_id == "line_cv" or visual_id == "bar_cv":
        return {"kind": "line", "points": fetch_line_cv(connect_fn, year), "scalar": None}
    return {"kind": "empty", "points": [], "scalar": None}


def _empty_chart() -> dict[str, Any]:
    return {"kind": "empty", "points": [], "scalars": {}, "scalar": None}


def build_page_dashboard(
    connect_fn: Callable[[], Any],
    level: str,
    year: int | None = None,
    contract: str | None = None,
    role: str | None = None,
    country: str | None = None,
) -> dict[str, Any]:
    from kpi_data import page_slugs, run_page_queries, run_slug_query
    from pbi_layout import parse_page_layout

    measures: dict[str, float] = {}
    if level == "executive":
        try:
            measures = fetch_executive_measures(connect_fn, year, contract)
        except Exception as exc:
            measures = {"_error": str(exc)[:200]}

    try:
        charts_legacy = run_page_queries(connect_fn, level)
    except Exception:
        charts_legacy = {}

    try:
        layout = parse_page_layout(level)
    except Exception:
        layout = {
            "level": level,
            "displayName": level,
            "width": 1280,
            "height": 720,
            "visuals": [],
        }

    visual_data: dict[str, Any] = {}
    for vis in layout.get("visuals") or []:
        vid = vis["id"]
        try:
            if level == "executive":
                visual_data[vid] = visual_data_for_executive(
                    connect_fn, vid, year, contract, measures
                )
            elif vid in charts_legacy:
                visual_data[vid] = charts_legacy[vid]
            else:
                for slug in charts_legacy:
                    if slug in vid or vid in slug:
                        visual_data[vid] = charts_legacy[slug]
                        break
                if vid not in visual_data:
                    visual_data[vid] = _empty_chart()
        except Exception as exc:
            visual_data[vid] = {
                "kind": "error",
                "error": str(exc)[:200],
                "points": [],
                "scalars": {},
                "scalar": None,
            }
    layout_ids = {v["id"] for v in layout.get("visuals") or []}
    extra_cards: list[dict[str, Any]] = []
    manifest = _manifest_cards()
    for slug in page_slugs(level):
        if slug in layout_ids:
            continue
        chart = charts_legacy.get(slug) or run_slug_query(connect_fn, slug)
        visual_data[slug] = chart
        title = manifest.get(slug, slug.replace("_", " ").title())
        extra_cards.append({"slug": slug, "title": title, "data": chart})
    for slug, chart in charts_legacy.items():
        if slug not in visual_data:
            visual_data[slug] = chart
    return {
        "level": level,
        "layout": layout,
        "measures": measures,
        "visuals": visual_data,
        "extraCards": extra_cards,
        "filters": {"year": year, "contract": contract, "role": role, "country": country},
    }


def _manifest_cards() -> dict[str, str]:
    try:
        import json
        from pathlib import Path
        import os

        p = Path(os.environ.get("BI_MANIFEST_PATH", "/app/bi-manifest.json"))
        if p.is_file():
            data = json.loads(p.read_text(encoding="utf-8"))
            return {c["slug"]: c["title"] for c in data.get("cards", [])}
    except Exception:
        pass
    return {}
