#!/usr/bin/env python3
"""Génère le CV professionnel étudiant (texte du fixture) pour tests parser."""
from __future__ import annotations

from pathlib import Path

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
except ImportError as exc:
    raise SystemExit("pip install reportlab") from exc

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "find-me-python-2.1" / "tests" / "fixtures" / "CV-professionnel-Eya-Rhit.pdf"
TEXT = (ROOT / "find-me-python-2.1" / "tests" / "fixtures" / "eya_rhit_cv_text.txt").read_text(
    encoding="utf-8"
)


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    title = ParagraphStyle("T", parent=styles["Normal"], fontSize=18, fontName="Helvetica-Bold")
    body = ParagraphStyle("B", parent=styles["Normal"], fontSize=10, leading=14)
    doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=1.5 * cm, rightMargin=1.5 * cm)
    story = []
    for block in TEXT.split("\n\n"):
        block = block.strip()
        if not block:
            continue
        if block.isupper() and len(block) < 30:
            story.append(Paragraph(block.replace("\n", "<br/>"), title))
        else:
            story.append(Paragraph(block.replace("\n", "<br/>"), body))
        story.append(Spacer(1, 8))
    doc.build(story)
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
