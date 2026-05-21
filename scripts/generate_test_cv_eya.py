#!/usr/bin/env python3
"""
Génère un CV PDF de test (texte sélectionnable) pour Eya Rhit — Ingénieur aérospatial.
Usage:
  pip install reportlab
  python scripts/generate_test_cv_eya.py
Sortie: docs/sample-cvs/CV-Eya-Rhit-Ingenieur-Aerospatial.pdf
"""
from __future__ import annotations

from pathlib import Path

try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm, mm
    from reportlab.platypus import (
        HRFlowable,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )
except ImportError as exc:
    raise SystemExit("Installez reportlab: pip install reportlab") from exc

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "sample-cvs"
OUT_FILE = OUT_DIR / "CV-Eya-Rhit-Ingenieur-Aerospatial.pdf"

# Couleurs FindMe / aéro
NAVY = colors.HexColor("#1e3a5f")
ORANGE = colors.HexColor("#f97316")
SLATE = colors.HexColor("#475467")
LIGHT_BG = colors.HexColor("#f8fafc")
ACCENT_LINE = colors.HexColor("#e2e8f0")


def build_story(styles):
    title = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=22,
        textColor=NAVY,
        spaceAfter=4,
    )
    subtitle = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        textColor=ORANGE,
        spaceAfter=10,
    )
    section = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=colors.white,
        backColor=NAVY,
        borderPadding=(6, 8, 6, 8),
        spaceBefore=12,
        spaceAfter=6,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        textColor=SLATE,
        leading=13,
        spaceAfter=4,
    )
    bullet = ParagraphStyle(
        "Bullet",
        parent=body,
        leftIndent=12,
        bulletIndent=0,
        spaceBefore=2,
    )
    label = ParagraphStyle(
        "Label",
        parent=body,
        fontName="Helvetica-Bold",
        textColor=NAVY,
        fontSize=9,
    )

    story = []

    # En-tête
    story.append(Paragraph("EYA RHIT", title))
    story.append(
        Paragraph(
            "Ingénieur aérospatial polyvalent — Modélisation numérique &amp; projets spatiaux",
            subtitle,
        )
    )

    contact_data = [
        ["Email", "Eya.Rhit01@esprit.tn"],
        ["Téléphone", "+216 52 24 71 80"],
        ["Localisation", "Gouvernorat Ariana, Tunisie"],
        ["LinkedIn", "linkedin.com/in/eya-rhit"],
    ]
    contact_table = Table(contact_data, colWidths=[2.8 * cm, 12.5 * cm])
    contact_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
                ("TEXTCOLOR", (1, 0), (1, -1), SLATE),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    story.append(contact_table)
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT_LINE))

    # PROFIL
    story.append(Paragraph("PROFIL", section))
    story.append(
        Paragraph(
            "Ingénieur aérospatial diplômé, je dispose d'une expérience significative dans la "
            "<b>modélisation numérique</b>, l'<b>analyse de performances aérodynamiques</b> (CFD) "
            "et la <b>gestion de projets spatiaux</b>. Rigoureuse, orientée résultats et à l'aise "
            "avec les outils de simulation et de conception assistée par ordinateur.",
            body,
        )
    )

    # COMPÉTENCES TECHNIQUES
    story.append(Paragraph("COMPÉTENCES TECHNIQUES", section))
    skills = [
        ("Langages de programmation", "Python, MATLAB, C++, Fortran"),
        ("Modélisation numérique", "ANSYS Fluent, OpenFOAM, Star-CCM+, CATIA"),
        ("Simulation", "CFD, FEA, maillage hexa/tétra, post-traitement ParaView"),
        ("Aérodynamique", "Écoulements compressibles, couche limite, portance/trainée"),
        ("CAO", "CATIA V5, SolidWorks, SpaceClaim"),
        ("Outils", "Git, Linux, LaTeX, MS Project, Jupyter"),
        ("Méthodologie", "Agile, V-cycle, gestion des risques projets spatiaux"),
    ]
    for cat, vals in skills:
        story.append(Paragraph(f"<b>{cat} :</b> {vals}", bullet))

    # ÉDUCATION
    story.append(Paragraph("ÉDUCATION", section))
    story.append(
        Paragraph(
            "<b>ESPRIT — École Supérieure Privée d'Ingénierie et de Technologies</b> "
            "2019 – 2023",
            label,
        )
    )
    story.append(
        Paragraph(
            "Diplôme d'Ingénieur en Génie Aérospatial — spécialité structures &amp; propulsion",
            body,
        )
    )
    story.append(Spacer(1, 4))
    story.append(
        Paragraph("<b>INSAT — Institut National des Sciences Appliquées et de Technologie</b> 2017 – 2019", label)
    )
    story.append(Paragraph("Classes préparatoires intégrées — Physique &amp; Sciences de l'Ingénieur", body))

    # EXPÉRIENCES (format lisible par le parseur: Titre – Entreprise | dates)
    story.append(Paragraph("EXPÉRIENCES PROFESSIONNELLES", section))
    story.append(Spacer(1, 4))
    story.append(
        Paragraph(
            "Ingénieur simulation CFD – Tunis Aerospace Solutions | Mars 2024 – Présent",
            label,
        )
    )
    story.append(
        Paragraph(
            "Analyse aérodynamique 2D/3D sur profils d'aile et fuselage. "
            "Optimisation maillage et validation en soufflerie. "
            "Rédaction de rapports techniques pour revues de projet client.",
            body,
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        Paragraph(
            "Stage ingénieur – Centre Spatial Tunisien (CST) | Juin 2023 – Décembre 2023",
            label,
        )
    )
    story.append(
        Paragraph(
            "Participation à la modélisation thermique d'un sous-système satellite. "
            "Collaboration avec l'équipe mécanique sur les interfaces structurelles.",
            body,
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        Paragraph(
            "Stage étudiant – Projet drone longue endurance | Septembre 2022 – Juin 2023",
            label,
        )
    )
    story.append(
        Paragraph(
            "Dimensionnement aérodynamique et choix propulsion électrique. "
            "Validation numérique sous ANSYS Fluent.",
            body,
        )
    )

    # PROJETS
    story.append(Paragraph("PROJETS ACADÉMIQUES", section))
    story.append(
        Paragraph(
            "<b>CubeSat étudiant — charge utile thermique</b> : conception, simulation et tests environnementaux.",
            bullet,
        )
    )
    story.append(
        Paragraph(
            "<b>Benchmark CFD NACA 0012</b> : comparaison OpenFOAM / expériences bibliographiques.",
            bullet,
        )
    )

    # LANGUES
    story.append(Paragraph("LANGUES", section))
    story.append(Paragraph("Français : Langue maternelle", bullet))
    story.append(Paragraph("Anglais : Courant (TOEIC 920)", bullet))
    story.append(Paragraph("Arabe : Professionnel", bullet))

    # CERTIFICATIONS
    story.append(Paragraph("CERTIFICATIONS", section))
    story.append(Paragraph("ANSYS Fluent Advanced CFD — 2024", bullet))
    story.append(Paragraph("CATIA V5 Associate — 2023", bullet))

    return story


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUT_FILE),
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        title="CV Eya Rhit - Ingénieur aérospatial",
        author="FindMe Test Generator",
    )
    styles = getSampleStyleSheet()
    story = build_story(styles)
    doc.build(story)
    print(f"CV généré : {OUT_FILE}")
    print(f"Taille : {OUT_FILE.stat().st_size / 1024:.1f} Ko")


if __name__ == "__main__":
    main()
