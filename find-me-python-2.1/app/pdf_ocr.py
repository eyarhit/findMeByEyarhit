from __future__ import annotations

import io
import logging
import shutil

logger = logging.getLogger(__name__)

OCR_LANGS = "fra+eng+ara"
OCR_DPI = 300


def tesseract_available() -> bool:
    try:
        import pytesseract

        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return bool(shutil.which("tesseract"))


def ocr_pdf_bytes(file_bytes: bytes, langs: str = OCR_LANGS, dpi: int = OCR_DPI) -> tuple[str, list[str]]:
    """
    OCR pour PDF scannés (images). Retourne (texte, warnings).
    """
    warnings: list[str] = []
    try:
        from pdf2image import convert_from_bytes
        import pytesseract
    except ImportError as exc:
        warnings.append(f"OCR indisponible (dépendances): {exc}")
        return "", warnings

    if not tesseract_available():
        warnings.append("Tesseract non installé — impossible de lire un PDF scanné.")
        return "", warnings

    try:
        images = convert_from_bytes(file_bytes, dpi=dpi, fmt="png")
    except Exception as exc:
        warnings.append(f"Conversion PDF→image échouée: {exc}")
        return "", warnings

    if not images:
        warnings.append("PDF sans pages image.")
        return "", warnings

    parts: list[str] = []
    config = "--oem 3 --psm 6"
    for i, img in enumerate(images):
        try:
            page_text = pytesseract.image_to_string(img, lang=langs, config=config)
            if page_text and page_text.strip():
                parts.append(page_text)
        except Exception as exc:
            warnings.append(f"OCR page {i + 1} échouée: {exc}")

    text = "\n\n".join(parts).strip()
    if not text:
        warnings.append("OCR n'a extrait aucun texte — vérifiez la qualité du scan.")
    return text, warnings
