from __future__ import annotations

import io
import re

import pdfplumber


def extract_pdf_text(file_bytes: bytes) -> tuple[str, str, int]:
    """Return (plain_text, layout_text, page_count)."""
    plain_parts: list[str] = []
    layout_parts: list[str] = []

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        page_count = len(pdf.pages)
        for page in pdf.pages:
            plain_parts.append(page.extract_text() or "")
            layout_parts.append(page.extract_text(layout=True) or "")

    plain = normalize_whitespace("\n".join(plain_parts))
    layout = normalize_whitespace("\n".join(layout_parts))
    # Prefer layout when it yields richer structure (multi-column CVs).
    primary = layout if len(layout) >= len(plain) * 0.8 else plain
    return primary, layout, page_count


def normalize_whitespace(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
