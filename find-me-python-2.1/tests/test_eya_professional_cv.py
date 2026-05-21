"""Test intégration — CV professionnel Eya Rhit (étudiante IAG)."""
from __future__ import annotations

from pathlib import Path

from app.cv_parser import parse_cv_pdf

FIXTURE_PDF = Path(__file__).parent / "fixtures" / "CV-professionnel-Eya-Rhit.pdf"
FILENAME = "CV professionnel de Eya Rhit.pdf"


def _parse():
    assert FIXTURE_PDF.exists(), f"Générez le PDF: python scripts/generate_cv_eya_professionnel.py"
    return parse_cv_pdf(FIXTURE_PDF.read_bytes(), filename=FILENAME)


def test_personal_info():
    data = _parse().data
    pi = data.personal_info
    assert pi
    assert pi.full_name and "eya" in (pi.full_name or "").lower()
    assert pi.email and "icloud.com" in pi.email
    assert pi.phone
    assert pi.job_title and "informatique" in pi.job_title.lower()
    assert pi.location and "ariana" in pi.location.lower()
    assert "passionnée" not in (pi.location or "").lower()


def test_technical_skills_categories():
    ts = _parse().data.technical_skills
    prog = [x.lower() for x in ts.get("programming_languages", [])]
    assert "java" in prog and "python" in prog
    assert "spring" not in prog and "html" not in prog

    assert "html" in [x.lower() for x in ts.get("markup_languages", [])]
    assert "mysql" in [x.lower() for x in ts.get("databases", [])]
    assert "linux" in [x.lower() for x in ts.get("operating_systems", [])]
    assert "uml" in [x.lower() for x in ts.get("design", [])]

    tools = [x.lower() for x in ts.get("tools", [])]
    assert any(t in tools for t in ("git", "netbeans", "eclipse", "power bi"))


def test_education_experiences_languages():
    data = _parse().data
    assert len(data.education) >= 1
    assert any("esprit" in (e.institution or "").lower() for e in data.education)

    assert len(data.work_experiences) >= 2
    companies = {(e.company or "").lower() for e in data.work_experiences}
    assert any("opalia" in c for c in companies)
    assert any("tsi" in c for c in companies)

    langs = {(l.language or "").lower() for l in data.languages}
    assert "français" in langs or "francais" in langs
    assert "anglais" in langs
    assert "arabe" in langs


def test_no_false_projects():
    assert len(_parse().data.projects) == 0
