"""Layout PBIR (positions + libellés commerciaux) aligné sur FindMe-Dashboard."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import os

REPORT_DEF = Path(os.environ.get("PBI_REPORT_DEF", "/app/pbi-report"))

PAGE_FOLDER = {
    "executive": "page_exec_findme01",
    "managerial": "page_mgr_findme02",
    "operational": "page_ops_findme03",
    "technique": "page_tech_findme04",
}

# Libellés métier (pas de jargon technique)
VISUAL_TITLES: dict[str, str] = {
    "kpi_acc": "Candidatures acceptées",
    "kpi_cand": "Candidatures reçues",
    "kpi_ref": "Candidatures refusées",
    "kpi_tx": "Taux d'acceptation",
    "kpi_open": "Missions ouvertes",
    "kpi_mis": "Missions publiées",
    "line_cand": "Évolution des candidatures",
    "line_trend": "Tendance recrutement",
    "line_taux": "Taux de conversion",
    "bar_month": "Missions par mois",
    "bar_top_mission": "Missions les plus demandées",
    "donut_acc": "Répartition acceptées / refusées",
    "donut_statut": "Statut des candidatures",
    "tbl_kpi": "Synthèse direction",
    "tbl_detail": "Détail des missions",
    "slicer_year": "Année",
    "slicer_date": "Période",
    "slicer_contrat": "Type de contrat",
    "slicer_role": "Profil utilisateur",
    "slicer_pays": "Pays",
    "slicer_skillcat": "Famille de compétences",
    "slicer_etl": "Exécution ETL",
    "kpi_u": "Utilisateurs actifs",
    "kpi_n": "Notifications",
    "kpi_nl": "Notifications lues",
    "kpi_nt": "Taux de lecture",
    "kpi_cv": "CV enregistrés",
    "kpi_st": "Compétences renseignées",
    "kpi_fav": "Favoris missions",
    "line_notif": "Notifications par mois",
    "line_activity": "Activité plateforme",
    "bar_steps": "Complétion des CV",
    "bar_skills": "Compétences les plus citées",
    "donut_role": "Répartition par profil",
    "donut_skillcat": "Catégories de compétences",
    "bar_ville": "Missions par ville",
    "bar_ville_stack": "Répartition géographique",
    "bar_contrat": "Types de contrat",
    "line_month": "Activité mensuelle",
    "kpi_etl": "Runs ETL réussis",
    "kpi_qz": "Quiz réalisés",
    "kpi_qs": "Score moyen quiz",
    "kpi_qt": "Taux réussite quiz",
    "kpi_cg": "Sessions CodinGame",
    "kpi_cs": "Score moyen CodinGame",
    "tbl_etl": "Journal ETL",
    "line_quiz": "Scores quiz",
    "donut_passed": "Quiz réussis / échoués",
    "bar_fw": "Frameworks CodinGame",
    "line_cdg_month": "Sessions CodinGame par mois",
    "bar_user_quiz": "Quiz par utilisateur",
}

SKIP_VISUALS = {"header_main", "title01", "nav_pages", "col_acc_ref"}


def _detect_visual_type(visual: dict) -> str:
    vtype = (visual.get("visual", {}) or {}).get("visualType", "")
    if vtype:
        return vtype
    name = visual.get("name", "")
    if name.startswith("kpi_"):
        return "card"
    if name.startswith("slicer_"):
        return "slicer"
    if "tbl_" in name:
        return "tableEx"
    if "donut" in name:
        return "donutChart"
    if "line" in name:
        return "lineChart"
    if "bar" in name:
        return "barChart"
    return "visual"


def _extract_measure_title(visual: dict) -> str | None:
    try:
        projections = (
            visual.get("visual", {})
            .get("query", {})
            .get("queryState", {})
            .get("Values", {})
            .get("projections", [])
        )
        for p in projections:
            field = p.get("field", {})
            if "Measure" in field:
                return field["Measure"].get("Property")
            if "Column" in field:
                return field["Column"].get("Property")
    except (TypeError, KeyError):
        pass
    return None


def parse_page_layout(level: str) -> dict[str, Any]:
    folder_name = PAGE_FOLDER.get(level)
    if not folder_name:
        return {"error": "Niveau inconnu", "visuals": []}
    page_dir = REPORT_DEF / "pages" / folder_name
    page_json = page_dir / "page.json"
    width, height = 1280, 720
    if page_json.is_file():
        meta = json.loads(page_json.read_text(encoding="utf-8"))
        width = int(meta.get("width") or width)
        height = int(meta.get("height") or height)
    visuals_dir = page_dir / "visuals"
    items: list[dict[str, Any]] = []
    if visuals_dir.is_dir():
        for vis_path in visuals_dir.glob("*/visual.json"):
            try:
                vj = json.loads(vis_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                continue
            name = vj.get("name") or vis_path.parent.name
            if name in SKIP_VISUALS:
                continue
            pos = vj.get("position") or {}
            measure = _extract_measure_title(vj)
            title = VISUAL_TITLES.get(name) or measure or name.replace("_", " ").title()
            items.append(
                {
                    "id": name,
                    "title": title,
                    "visualType": _detect_visual_type(vj),
                    "x": int(pos.get("x") or 0),
                    "y": int(pos.get("y") or 0),
                    "width": int(pos.get("width") or 120),
                    "height": int(pos.get("height") or 80),
                    "z": int(pos.get("z") or 0),
                    "measure": measure,
                }
            )
    items.sort(key=lambda v: (v["z"], v["y"], v["x"]))
    return {
        "level": level,
        "displayName": {
            "executive": "01 - Executive",
            "managerial": "02 - Managerial",
            "operational": "03 - Operationnel",
            "technique": "04 - Technique",
        }.get(level, level),
        "width": width,
        "height": height,
        "visuals": items,
    }
