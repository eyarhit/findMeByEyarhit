from __future__ import annotations

import re


def repair_ocr_text(text: str) -> str:
    """Corrige artefacts OCR fréquents avant parsing structuré."""
    if not text:
        return text

    text = text.replace("\u2019", "'").replace("\u2018", "'")
    text = text.replace("\u2013", "-").replace("\u2014", "-")
    text = re.sub(r"[ \t]+", " ", text)

    # Emails : O -> 0 dans le domaine uniquement si pattern cassé
    text = re.sub(
        r"([\w.\-+]+)@([\w.\-]+)\.([\w]{2,})",
        lambda m: f"{m.group(1)}@{m.group(2)}.{m.group(3)}",
        text,
    )

    # Fusionner lettres isolées sur lignes courtes (C V -> CV)
    lines = []
    for ln in text.split("\n"):
        ln = ln.strip()
        if re.match(r"^(\w\s){3,}\w$", ln):
            ln = ln.replace(" ", "")
        lines.append(ln)

    text = "\n".join(lines)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"(\d)\s+(\d)", r"\1\2", text)
    text = re.sub(r"(\w)\s*@\s*(\w)", r"\1@\2", text)
    return text.strip()


def ocr_quality_score(text: str) -> float:
    """Score 0–1 basé sur densité de texte utile."""
    if not text:
        return 0.0
    alnum = sum(1 for c in text if c.isalnum())
    return min(1.0, alnum / 400)
