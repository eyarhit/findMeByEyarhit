#!/usr/bin/env python3
"""
Exporte les dashboards Metabase Find-Me en PDF via l'API (si disponible).
Sinon génère export-manifest.json avec URLs pour export manuel.
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

MB_URL = os.environ.get("METABASE_URL", "http://localhost:3030").rstrip("/")
MB_EMAIL = os.environ.get("METABASE_SETUP_EMAIL", "bi-admin@findme.local")
MB_PASSWORD = os.environ.get("METABASE_SETUP_PASSWORD", "FindMe_BI_Auto_2026!xQ7vM2")

DASHBOARD_NAMES = [
    "Find-Me — BI Executive",
    "Find-Me — BI Managérial",
    "Find-Me — BI Opérationnel",
]

OUT_DIR = Path(__file__).resolve().parent / "exports"


def login(sess: requests.Session) -> str:
    r = sess.post(
        f"{MB_URL}/api/session",
        json={"username": MB_EMAIL, "password": MB_PASSWORD},
        timeout=60,
    )
    if not r.ok:
        print(f"Connexion Metabase échouée: {r.status_code} {r.text[:300]}", file=sys.stderr)
        sys.exit(1)
    token = r.json().get("id")
    if not token:
        sys.exit(1)
    return token


def list_dashboards(sess: requests.Session, token: str) -> list[dict]:
    r = sess.get(
        f"{MB_URL}/api/dashboard",
        headers={"X-Metabase-Session": token},
        timeout=60,
    )
    r.raise_for_status()
    data = r.json()
    if isinstance(data, list):
        return data
    return data.get("data") or []


def safe_filename(name: str) -> str:
    return (
        name.replace("—", "-")
        .replace(" ", "-")
        .replace("/", "-")
        .replace("é", "e")
        .replace("é", "e")
    )


def try_export_pdf(sess: requests.Session, token: str, dash_id: int) -> bytes | None:
    headers = {"X-Metabase-Session": token}
    for method, url, kwargs in [
        ("GET", f"{MB_URL}/api/dashboard/{dash_id}/pdf", {}),
        (
            "POST",
            f"{MB_URL}/api/dashboard/{dash_id}/pdf",
            {"json": {"width": 1280, "height": 720}},
        ),
    ]:
        try:
            r = sess.request(method, url, headers=headers, timeout=120, **kwargs)
            if r.ok and r.headers.get("content-type", "").startswith("application/pdf"):
                return r.content
            if r.ok and r.content[:4] == b"%PDF":
                return r.content
        except requests.RequestException:
            continue
    return None


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sess = requests.Session()
    print(f"Metabase: {MB_URL}")
    token = login(sess)
    dashboards = list_dashboards(sess, token)
    manifest: list[dict] = []

    for target_name in DASHBOARD_NAMES:
        row = next((d for d in dashboards if d.get("name") == target_name), None)
        if not row:
            print(f"  ⚠ Dashboard introuvable: {target_name}")
            manifest.append({"name": target_name, "status": "missing", "url": None})
            continue

        dash_id = row["id"]
        url = f"{MB_URL}/dashboard/{dash_id}"
        pdf_bytes = try_export_pdf(sess, token, dash_id)
        entry = {
            "name": target_name,
            "id": dash_id,
            "url": url,
            "exportedAt": datetime.now(timezone.utc).isoformat(),
        }

        if pdf_bytes:
            out_path = OUT_DIR / f"{safe_filename(target_name)}.pdf"
            out_path.write_bytes(pdf_bytes)
            entry["status"] = "ok"
            entry["file"] = str(out_path.name)
            print(f"  ✓ PDF: {out_path.name} ({len(pdf_bytes) // 1024} Ko)")
        else:
            entry["status"] = "manual_required"
            entry["file"] = None
            print(f"  → Export manuel requis: {url}")
        manifest.append(entry)

    manifest_path = OUT_DIR / "export-manifest.json"
    manifest_path.write_text(
        json.dumps({"metabaseUrl": MB_URL, "dashboards": manifest}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Manifest: {manifest_path}")
    if any(m.get("status") == "manual_required" for m in manifest):
        print("Voir bi/presentation/GUIDE_EXPORT_PDF.md pour export via l'UI Metabase.")


if __name__ == "__main__":
    main()
