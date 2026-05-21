from __future__ import annotations

import io
import re
from dataclasses import dataclass

import pdfplumber

from .ocr_cleanup import repair_ocr_text
from .pdf_ocr import ocr_pdf_bytes

# En dessous : PDF probablement scanné (image)
MIN_NATIVE_TEXT_CHARS = 120


@dataclass
class PdfExtractResult:
    plain_text: str
    layout_text: str
    page_count: int
    ocr_used: bool = False
    ocr_warnings: list[str] | None = None
    extraction_source: str = "native"  # native | ocr | native+ocr


def extract_pdf_text(file_bytes: bytes) -> tuple[str, str, int]:
    """API historique — retourne (plain, layout, pages)."""
    result = extract_pdf_full(file_bytes)
    return result.plain_text, result.layout_text, result.page_count


def extract_pdf_full(file_bytes: bytes) -> PdfExtractResult:
    """Texte natif + OCR automatique si le PDF est scanné."""
    plain_parts: list[str] = []
    layout_parts: list[str] = []

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        page_count = len(pdf.pages)
        for page in pdf.pages:
            plain_parts.append(page.extract_text() or "")
            layout_parts.append(page.extract_text(layout=True) or "")

    plain = normalize_whitespace("\n".join(plain_parts))
    layout = normalize_whitespace("\n".join(layout_parts))
    best_native = layout if len(layout) >= len(plain) * 0.8 else plain
    native_len = max(len(plain), len(layout))

    ocr_used = False
    ocr_warnings: list[str] = []
    source = "native"
    ocr_text = ""

    if native_len < MIN_NATIVE_TEXT_CHARS or native_len < 500:
        ocr_text, ocr_warnings = ocr_pdf_bytes(file_bytes)
        ocr_text = repair_ocr_text(normalize_whitespace(ocr_text))

    if native_len < MIN_NATIVE_TEXT_CHARS:
        if len(ocr_text) > 30:
            ocr_used = True
            plain = ocr_text
            layout = ocr_text
            source = "ocr"
        else:
            plain = best_native
            layout = layout if len(layout) >= len(plain) else plain
    elif native_len < 500 and len(ocr_text) > native_len * 1.2:
        ocr_used = True
        merged = normalize_whitespace(f"{best_native}\n\n{ocr_text}")
        plain = merged
        layout = merged
        source = "native+ocr"
    else:
        plain = best_native
        layout = layout if len(layout) >= len(plain) else plain

    return PdfExtractResult(
        plain_text=plain,
        layout_text=layout,
        page_count=page_count,
        ocr_used=ocr_used,
        ocr_warnings=ocr_warnings,
        extraction_source=source,
    )


def normalize_whitespace(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
