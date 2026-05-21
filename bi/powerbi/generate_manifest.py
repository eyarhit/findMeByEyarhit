#!/usr/bin/env python3
"""Génère bi-manifest.json pour l'admin Angular (stack Talend + Power BI)."""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(os.environ.get("BI_MANIFEST_PATH", "find-me-front-2.1/src/assets/bi/bi-manifest.json"))

manifest = {
    "version": 2,
    "stack": "talend-powerbi",
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "problematic": "Pilotage recrutement et missions ESN — plateforme Find-Me",
    "powerBiGuideUrl": os.environ.get("POWERBI_GUIDE_URL", "http://localhost:8088"),
    "mysql": {
        "host": os.environ.get("MYSQL_HOST_EXTERNAL", "localhost"),
        "port": int(os.environ.get("MYSQL_PORT", "3306")),
        "database": "findme_dw",
        "user": "findme_bi",
        "passwordHint": "findme_bi_readonly (docker-compose / BI_METABASE.md)",
    },
    "etl": {
        "tool": "Talend Open Studio",
        "jobName": "FindMe_Load_DW",
        "dockerService": "talend-etl",
        "command": "docker compose run --rm talend-etl",
    },
    "reports": [
        {
            "level": "executive",
            "name": "Find-Me — Vue direction",
            "file": "bi/powerbi/reports/01_Executive.pbix",
            "pages": ["KPI globaux", "Candidatures par mois", "Taux de conversion"],
        },
        {
            "level": "managerial",
            "name": "Find-Me — Pilotage RH",
            "file": "bi/powerbi/reports/02_Managerial.pbix",
            "pages": ["Missions par statut", "Top villes", "Compétences CV"],
        },
        {
            "level": "operational",
            "name": "Find-Me — Opérationnel",
            "file": "bi/powerbi/reports/03_Operational.pbix",
            "pages": ["Notifications", "Quiz", "Codingame"],
        },
    ],
    "dimensions": {
        "temps": "dim_date",
        "localisation": "dim_localisation",
        "utilisateur": "dim_user",
        "mission": "dim_mission",
    },
    "credentials": {
        "mysqlReadOnlyUser": "findme_bi",
        "powerBiNote": "Ouvrir Power BI Desktop → MySQL findme_dw (voir guide port 8088)",
    },
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"Manifest BI écrit : {OUT.resolve()}")
