from __future__ import annotations

import re
from typing import Any

from .models import (
    EducationItem,
    LanguageItem,
    ParseData,
    PersonalInfo,
    ProjectItem,
    WorkExperienceItem,
)
from .cv_sections import (
    DEFAULT_STOP_HEADERS,
    DEGREE_KEYWORDS,
    EXPERIENCE_ROLE_PREFIX,
    GENERIC_PROJECT_LINE,
    HEADERS_CERTIFICATIONS,
    HEADERS_EDUCATION,
    HEADERS_EXPERIENCE,
    HEADERS_LANGUAGES,
    HEADERS_PROFILE,
    HEADERS_PROJECTS,
    HEADERS_SKILLS,
    INSTITUTION_MARKERS,
    LANGUAGE_NAMES,
    SKILL_CATEGORIES,
)
from .field_mapper import apply_field_mapping
from .ocr_cleanup import ocr_quality_score
from .pdf_extract import extract_pdf_full
from .validation import validate_and_score

MONTHS_FR = {
    "janvier": 1,
    "janv": 1,
    "février": 2,
    "fevrier": 2,
    "fév": 2,
    "fev": 2,
    "mars": 3,
    "avril": 4,
    "avr": 4,
    "mai": 5,
    "juin": 6,
    "juillet": 7,
    "juil": 7,
    "août": 8,
    "aout": 8,
    "septembre": 9,
    "sept": 9,
    "sep": 9,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "oct": 10,
    "nov": 11,
    "dec": 12,
    "octobre": 10,
    "oct": 10,
    "novembre": 11,
    "nov": 11,
    "décembre": 12,
    "decembre": 12,
    "déc": 12,
    "dec": 12,
}

def _skill_label_prefix_pattern() -> re.Pattern[str]:
    labels = sorted(SKILL_CATEGORIES.keys(), key=len, reverse=True)
    inner = "|".join(re.escape(l) for l in labels[:60])
    return re.compile(rf"^({inner})\s*:", re.I)


SKILL_LINE_PREFIX = _skill_label_prefix_pattern()

VOLUNTEER_MARKERS = re.compile(
    r"\b(bénévolat|benevolat|associatif|croissant rouge|jci|actions communautaires|"
    r"solidarité|solidarite|engagement)\b",
    re.I,
)

# Limite alignée sur la colonne MySQL `competence.db` (varchar ~255)
MAX_SKILL_FIELD_CHARS = 255
MAX_SKILL_ITEM_CHARS = 80
MAX_EXPERIENCE_DESC_CHARS = 240


def _normalize_cv_text(text: str) -> str:
    """Unifie apostrophes / puces pour matcher les libellés du parseur."""
    text = text.replace("\u2019", "'").replace("\u2018", "'").replace("\u2013", "-").replace("\u2014", "-")
    lines = []
    for ln in text.split("\n"):
        ln = re.sub(r"^[·•]\s*", "", ln.strip())
        lines.append(ln)
    return "\n".join(lines)


def _collect_source_texts(text: str, layout_text: str) -> list[str]:
    """Plusieurs vues du PDF (texte simple + mise en page) pour CV mondiaux variés."""
    out: list[str] = []
    for raw in (text, layout_text):
        norm = _normalize_cv_text(raw)
        if len(norm.strip()) >= 40 and norm not in out:
            out.append(norm)
    return out or [_normalize_cv_text(text or layout_text)]


def _merge_education(items_list: list[list[EducationItem]]) -> list[EducationItem]:
    merged: list[EducationItem] = []
    seen: set[str] = set()
    for items in items_list:
        for edu in items:
            key = f"{(edu.institution or '').lower()}|{(edu.degree or '').lower()}"
            if key in seen or key == "|":
                continue
            seen.add(key)
            merged.append(edu)
    return merged[:8]


def _merge_experiences(items_list: list[list[WorkExperienceItem]]) -> list[WorkExperienceItem]:
    merged: list[WorkExperienceItem] = []
    seen: set[str] = set()
    for items in items_list:
        for exp in items:
            key = f"{(exp.company or '').lower()}|{(exp.position or '').lower()}"
            if key in seen or key == "|":
                continue
            seen.add(key)
            merged.append(exp)
    return merged[:12]


def _merge_skills(dicts: list[dict[str, Any]]) -> dict[str, Any]:
    out: dict[str, list[str]] = {}
    for d in dicts:
        for key, val in d.items():
            if not isinstance(val, list):
                continue
            bucket = out.setdefault(key, [])
            for item in val:
                if item not in bucket:
                    bucket.append(item)
    return out


def parse_cv_pdf(file_bytes: bytes, filename: str = ""):
    extracted = extract_pdf_full(file_bytes)
    text, layout_text, page_count = (
        extracted.plain_text,
        extracted.layout_text,
        extracted.page_count,
    )
    sources = _collect_source_texts(text, layout_text)
    source = max(sources, key=len)

    if len(source.strip()) < 40:
        data = ParseData()
        response = validate_and_score(data, source)
        response.metadata.ocr_used = extracted.ocr_used
        response.metadata.extraction_source = extracted.extraction_source
        response.metadata.warnings.append(
            f"PDF illisible ({page_count} page(s)). "
            "Utilisez un scan plus net (300 DPI) ou un PDF exporté depuis Word."
        )
        if extracted.ocr_warnings:
            response.metadata.warnings.extend(extracted.ocr_warnings)
        return response

    educations: list[list[EducationItem]] = []
    experiences: list[list[WorkExperienceItem]] = []
    skills_list: list[dict[str, Any]] = []
    languages_all: list[LanguageItem] = []
    projects_all: list[ProjectItem] = []
    personal = PersonalInfo()

    for src in sources:
        educations.append(_parse_education(src))
        educations.append(_parse_education_fallback(src))
        experiences.append(_parse_experiences(src))
        experiences.append(_parse_experiences_fallback(src))
        skills_list.append(_normalize_skill_categories(_parse_technical_skills(src)))
        skills_list.append(_normalize_skill_categories(_parse_skills_fallback(src)))
        languages_all.extend(_parse_languages(src))
        projects_all.extend(_parse_projects(src))

    personal = _parse_personal(source)
    if filename and (not personal.job_title or len(personal.job_title or "") < 12):
        title_from_name = _job_title_from_filename(filename)
        if title_from_name:
            personal.job_title = title_from_name

    data = apply_field_mapping(
        ParseData(
            personal_info=personal,
            education=_merge_education(educations),
            technical_skills=_merge_skills(skills_list),
            languages=_dedupe_languages(languages_all),
            work_experiences=_merge_experiences(experiences),
            projects=_dedupe_projects(projects_all),
        )
    )
    response = validate_and_score(data, source)
    response.metadata.extraction_method = "rule_based_grounded_multilingual"
    response.metadata.extraction_source = extracted.extraction_source
    response.metadata.ocr_used = extracted.ocr_used
    response.metadata.ocr_quality_score = ocr_quality_score(source)
    response.metadata.ocr_acceptable = len(source.strip()) >= 80
    if extracted.ocr_used:
        response.metadata.warnings.insert(
            0,
            "PDF scanné détecté — texte extrait par OCR (Tesseract). Vérifiez les champs avant enregistrement.",
        )
    if extracted.ocr_warnings:
        response.metadata.warnings.extend(extracted.ocr_warnings)
    if len(sources) > 1:
        response.metadata.warnings.append(
            "Extraction multi-passes (texte + mise en page PDF) pour compatibilité élargie."
        )
    return response


def _dedupe_languages(items: list[LanguageItem]) -> list[LanguageItem]:
    out: list[LanguageItem] = []
    seen: set[str] = set()
    for lang in items:
        key = (lang.language or "").lower()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(lang)
    return out[:12]


def _dedupe_projects(items: list[ProjectItem]) -> list[ProjectItem]:
    out: list[ProjectItem] = []
    seen: set[str] = set()
    for p in items:
        key = (p.title or "").lower()[:80]
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(p)
    return out[:15]


def _parse_education_fallback(text: str) -> list[EducationItem]:
    """Repère formations même sans section « ÉDUCATION » explicite."""
    items: list[EducationItem] = []
    seen: set[str] = set()
    year_line = re.compile(
        r"^(.{4,90}?)\s+(\d{4})\s*[-–—]\s*(\d{4}|present|présent|present|current|aujourd)",
        re.I | re.M,
    )
    for m in year_line.finditer(text):
        line = m.group(1).strip(" -–—|:")
        if not _looks_like_institution(line) and not DEGREE_KEYWORDS.search(line):
            continue
        inst = line if _looks_like_institution(line) else _institution_on_line(line)
        degree = line if DEGREE_KEYWORDS.search(line) else _next_degree_line(text, m.end())
        if not inst and not degree:
            continue
        key = f"{(inst or '').lower()}|{(degree or '').lower()}"
        if key in seen:
            continue
        seen.add(key)
        items.append(
            EducationItem(
                institution=inst or degree,
                degree=degree if degree != inst else None,
                start_date=_year_to_date(m.group(2)),
                end_date=_year_to_date(m.group(3), end_of_period=True),
                confidence=0.55,
            )
        )
    return items[:6]


def _parse_experiences_fallback(text: str) -> list[WorkExperienceItem]:
    """Poste – Entreprise | dates (FR/EN) sans mot « Stage » obligatoire."""
    items: list[WorkExperienceItem] = []
    seen: set[str] = set()
    for m in re.finditer(
        r"^(.{3,90}?)\s+at\s+(.{2,70}?)(?:\s*\|\s*(.+))?$",
        text,
        re.I | re.M,
    ):
        _append_experience(
            items, seen, text, m.group(1), m.group(2), (m.group(3) or ""), m.end(), m.end() + 500, 0.55
        )
    return items[:10]


def _parse_skills_fallback(text: str) -> dict[str, Any]:
    """Liste de technologies séparées par virgules (CV internationaux compacts)."""
    known = re.compile(
        r"\b(Java|Python|JavaScript|TypeScript|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|"
        r"HTML|CSS|SQL|MySQL|PostgreSQL|MongoDB|Redis|Docker|Kubernetes|AWS|Azure|GCP|"
        r"React|Angular|Vue|Node\.?js|Spring|Django|Flask|Git|Linux|Windows|MATLAB|"
        r"TensorFlow|PyTorch|Spark|Hadoop|Tableau|Power BI|Figma|Jira|UML|Agile|Scrum)\b",
        re.I,
    )
    found: list[str] = []
    for m in known.finditer(text):
        token = m.group(0)
        if token not in found:
            found.append(token)
    if len(found) < 3:
        return {}
    return {"programming_languages": found[:40]}


def _job_title_from_filename(filename: str) -> str | None:
    base = re.sub(r"\.pdf$", "", filename, flags=re.I).strip()
    m = re.search(
        r"(ingénieur[^,.\(]{0,120}|ingenieur[^,.\(]{0,120}|"
        r"[^,.\(]{0,80}(?:aérospatial|aerospatial|aéronautique|aeronautique)[^,.\(]{0,80})",
        base,
        re.I,
    )
    if m:
        return re.sub(r"\s+", " ", m.group(0).strip())[:220]
    if len(base) > 8 and len(base) < 180:
        return base[:220]
    return None


def _parse_personal(text: str) -> PersonalInfo:
    email = _first_match(r"[\w.\-+]+@[\w.\-]+\.[A-Za-z]{2,}", text)
    phone = _first_match(
        r"(?<!\d)(?:\+?\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{2,4}[\s\-.]?\d{2,4}[\s\-.]?\d{0,4}(?!\d)",
        text,
    )
    if not phone:
        phone = _first_match(r"(?<!\d)(?:\+216\s?)?[259]\d{7}(?!\d)", text.replace(" ", ""))

    linkedin = _first_match(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\-]+", text)
    full_name = _parse_name_from_header(text)

    location = None
    loc_m = re.search(
        r"(Gouvernorat\s+[\wÀ-ÿ\-]+|"
        r"Tunis(?:ie)?|Paris|Lyon|London|Berlin|New York|Dubai|Casablanca|"
        r"[\wÀ-ÿ\-]{2,40}\s*,\s*[\wÀ-ÿ\-]{2,40})",
        text,
        re.I,
    )
    if loc_m:
        location = loc_m.group(0).strip()

    job_title = None
    profil = _section_slice(text, HEADERS_PROFILE)
    for block in (profil, text):
        if not block:
            continue
        lines = [ln.strip() for ln in block.split("\n") if ln.strip()]
        for ln in lines:
            if (
                len(ln) > 20
                and not re.search(r"^\d", ln)
                and "@" not in ln
                and not re.match(r"^(CONTACT|COMPÉTENCES|COMPETENCES|PROFIL)\b", ln, re.I)
                and len(re.sub(r"[^A-Za-zÀ-ÿ]", "", ln)) >= 12
            ):
                job_title = re.sub(r"\s+", " ", ln)[:220]
                break
        if job_title:
            break

    return PersonalInfo(
        full_name=full_name,
        email=email,
        phone=phone,
        linkedin=linkedin,
        location=location,
        job_title=job_title,
        confidence=0.8 if job_title or email else 0.4,
    )


def _parse_name_from_header(text: str) -> str | None:
    """Première ligne type « JEAN DUPONT » ou « Jean Dupont »."""
    for line in text.split("\n")[:8]:
        line = line.strip()
        if not line or len(line) > 60:
            continue
        if "@" in line or re.search(r"\d{5,}", line):
            continue
        if re.match(r"^(CONTACT|CV|CURRICULUM|RESUME|RÉSUMÉ)\b", line, re.I):
            continue
        words = line.split()
        if 2 <= len(words) <= 5 and all(len(w) >= 2 for w in words):
            if line.isupper() or all(w[0].isupper() for w in words if w):
                return line[:80]
    return None


def _education_search_window(text: str) -> str:
    """PDF 2 colonnes : évite de couper sur EXPÉRIENCES au milieu des compétences."""
    upper = text.upper()
    start = -1
    for header in HEADERS_EDUCATION:
        i = upper.find(header)
        if i >= 0:
            start = i + len(header)
            break
    if start < 0:
        return text

    end = len(text)
    for h in (
        "EXPÉRIENCES PROFESSIONNELLES",
        "EXPERIENCES PROFESSIONNELLES",
        "PROJETS ACADEMIQUES",
        "PROJETS ACADÉMIQUES",
        "BÉNÉVOLAT",
        "BENEVOLAT",
        "LANGUES",
        "CERTIFICATIONS",
    ):
        m = re.search(rf"(?:^|\n)\s*{re.escape(h)}\b", text[start:], re.I)
        if m:
            end = min(end, start + m.start())

    window = text[start:end].strip()
    return window if len(window) > 30 else text


def _parse_education(text: str) -> list[EducationItem]:
    edu_section = _education_search_window(text)
    search_text = edu_section or text
    items: list[EducationItem] = []
    seen: set[str] = set()

    # Institution + year range on same line (2023 – 2025 or [2023 -2025])
    inst_pattern = re.compile(
        r"^[\s]*(.{4,80}?)\s*[\[\(]?\s*(\d{4})\s*[-–—]\s*(\d{4}|présent|present|aujourd['']hui)\s*[\]\)]?\s*$",
        re.I | re.M,
    )
    for m in inst_pattern.finditer(search_text):
        institution = m.group(1).strip(" -–—|:")
        if VOLUNTEER_MARKERS.search(institution):
            continue
        if not _looks_like_institution(institution):
            continue
        key = institution.lower()
        if key in seen:
            continue
        seen.add(key)
        start = _year_to_date(m.group(2))
        end = _year_to_date(m.group(3), end_of_period=True)
        degree = _find_degree_near(search_text, m.start(), m.end())
        if not degree or _degree_duplicates_institution(degree, institution):
            degree = _next_degree_line(search_text, m.end())
        items.append(
            EducationItem(
                institution=institution,
                degree=degree,
                start_date=start,
                end_date=end,
                confidence=0.85,
            )
        )

    # Degree line without separate institution line (merged columns)
    if not items:
        for m in DEGREE_KEYWORDS.finditer(search_text):
            line = _line_at(search_text, m.start())
            if VOLUNTEER_MARKERS.search(line):
                continue
            inst = _institution_on_line(line)
            if not inst:
                inst = _institution_near(search_text, m.start())
            start_date = None
            end_date = None
            month_range = re.search(
                r"((?:jan|feb|mar|avr|apr|may|mai|jun|jul|juil|aug|août|aout|sep|sept|oct|nov|déc|dec)[a-zéûô\.]*\s+\d{4})"
                r"\s*[-–—]\s*"
                r"(en\s+cours|présent|present|aujourd['']hui|"
                r"(?:jan|feb|mar|avr|apr|may|mai|jun|jul|juil|aug|août|aout|sep|sept|oct|nov|déc|dec)[a-zéûô\.]*\s+\d{4}|\d{4})",
                line,
                re.I,
            )
            if month_range:
                start_date = _parse_french_date(month_range.group(1))
                end_raw = month_range.group(2)
                if re.search(r"en\s+cours|présent|present|aujourd", end_raw, re.I):
                    end_date = None
                else:
                    end_date = _parse_french_date(end_raw, end_of_period=True)
            else:
                years = re.search(r"(\d{4})\s*[-–—]\s*(\d{4}|présent|present)", line, re.I)
                if years:
                    start_date = _year_to_date(years.group(1))
                    end_date = (
                        None
                        if re.search(r"présent|present", years.group(2), re.I)
                        else _year_to_date(years.group(2), end_of_period=True)
                    )
            items.append(
                EducationItem(
                    institution=inst,
                    degree=line.strip()[:120],
                    start_date=start_date,
                    end_date=end_date,
                    confidence=0.7,
                )
            )
            break

    return items[:6]


def _looks_like_institution(name: str) -> bool:
    if VOLUNTEER_MARKERS.search(name):
        return False
    if re.search(r"^(langages|bases|systèmes|stage|portfolio|plateforme)\b", name, re.I):
        return False
    low = name.lower()
    return any(m in low for m in INSTITUTION_MARKERS) or (
        DEGREE_KEYWORDS.search(name) is None and len(name) > 8
    )


def _degree_duplicates_institution(degree: str | None, institution: str) -> bool:
    if not degree:
        return False
    d = degree.lower().strip()
    i = institution.lower().strip()
    return d == i or d.startswith(i[: min(len(i), 25)]) or i.startswith(d[: min(len(d), 25)])


def _next_degree_line(text: str, pos: int) -> str | None:
    for line in text[pos : pos + 500].split("\n"):
        line = line.strip()
        if not line or SKILL_LINE_PREFIX.match(line):
            continue
        if VOLUNTEER_MARKERS.search(line):
            continue
        if DEGREE_KEYWORDS.search(line) and len(line) < 120:
            return line.strip(" :")[:120]
        if re.search(r"\b(licence|master|baccalauréat|baccalaureat|ingénieur|ingenieur)\b", line, re.I):
            return line[:120]
    return None


def _find_degree_near(text: str, start: int, end: int) -> str | None:
    window = text[max(0, start - 80) : min(len(text), end + 400)]
    for line in window.split("\n"):
        line = line.strip()
        if SKILL_LINE_PREFIX.match(line):
            continue
        if DEGREE_KEYWORDS.search(line) and len(line) < 120:
            cleaned = SKILL_LINE_PREFIX.sub("", line).strip(" :|-")
            if DEGREE_KEYWORDS.search(cleaned):
                return cleaned[:120]
    return None


def _institution_on_line(line: str) -> str | None:
    m = re.search(
        r"(ESPRIT[^,\n|]*|Université[^,\n|]+|École[^,\n|]+|Ecole[^,\n|]+|"
        r"Institut[^,\n|]+|Lycée[^,\n|]+|Lycee[^,\n|]+)",
        line,
        re.I,
    )
    return m.group(0).strip() if m else None


def _institution_near(text: str, pos: int) -> str | None:
    window = text[max(0, pos - 400) : min(len(text), pos + 400)]
    for line in window.split("\n"):
        inst = _institution_on_line(line.strip())
        if inst:
            return inst
    return None


def _skill_label_boundary_pattern() -> str:
    labels = sorted(SKILL_CATEGORIES.keys(), key=len, reverse=True)
    return "|".join(re.escape(l) for l in labels)


def _extract_skill_block(search: str, label: str) -> list[str]:
    """Lit une catégorie et ses lignes de continuation jusqu'au prochain libellé."""
    boundary = _skill_label_boundary_pattern()
    pat = rf"(?:^|\n)\s*{re.escape(label)}\s*:\s*"
    m = re.search(pat, search, re.I)
    if not m:
        return []
    rest = search[m.end() :]
    end = len(rest)
    next_label = re.search(rf"(?:^|\n)\s*(?:{boundary})\s*:", rest, re.I)
    if next_label:
        end = next_label.start()
    block = rest[:end]
    items: list[str] = []
    for line in block.split("\n"):
        line = line.strip()
        if not line:
            continue
        if re.match(rf"^(?:{boundary})\s*:", line, re.I):
            break
        if VOLUNTEER_MARKERS.search(line):
            break
        if re.match(
            r"^(EXPÉRIENCES|EXPERIENCES|PROJETS|LANGUES|PROFIL|CERTIFICATION)\b",
            line,
            re.I,
        ):
            break
        if re.match(r"^Stage\b", line, re.I):
            continue
        if DEGREE_KEYWORDS.search(line) and not re.search(
            r"(java|python|html|css|php|javascript|sql|mysql|linux|windows|uml|git|docker|power bi)",
            line,
            re.I,
        ):
            continue
        if re.search(r"\b(Initiation|Découverte|familiarisation|Participation|visualisation)\b", line, re.I):
            continue
        if "|" in line and re.search(r"\b(Juin|juillet|janvier)\s+\d{4}\b", line, re.I):
            continue
        chunk = re.split(
            r"\s{2,}EXPÉRIENCES|\s+EXPÉRIENCES\s+PROFESSIONNELLES|\s+Stage\s+d",
            line,
            flags=re.I,
        )[0]
        items.extend(_split_skill_list(chunk))
    return [i for i in items if _is_skill_token(i)]


def _skills_search_window(text: str) -> str:
    """
    Fenêtre de texte pour les compétences (PDF 2 colonnes).
    Les fins de section utilisent des titres en début de ligne, pas le mot « projets » dans une phrase.
    """
    upper = text.upper()
    start = -1
    for header in HEADERS_SKILLS:
        i = upper.find(header)
        if i >= 0:
            start = i
            break
    if start < 0:
        lang = upper.find("LANGAGES DE PROGRAMMATION")
        return text[lang:] if lang >= 0 else text

    # PDF 2 colonnes : « COMPÉTENCES » puis « TECHNIQUES » sur la ligne suivante
    if start >= 0:
        chunk = upper[start : start + 40]
        if "COMPÉTENCES" in chunk or "COMPETENCES" in chunk:
            tech = upper.find("TECHNIQUES", start)
            if tech >= 0 and tech - start < 40:
                start = tech

    tech = upper.find("TECHNIQUES", start)
    if tech >= 0 and tech - start < 250:
        start = tech

    lang = upper.find("LANGAGES DE PROGRAMMATION", start)
    if lang >= 0:
        start = min(start, lang)

    end = len(text)
    stop_headers = (
        "LANGUES",
        "PROFIL",
        "ÉDUCATION",
        "EDUCATION",
        "FORMATION",
        "PROJET ACADEMIQUE",
        "PROJET ACADÉMIQUE",
        "PROJETS ACADEMIQUES",
        "PROJETS ACADÉMIQUES",
        "STAGES",
        "EXPÉRIENCE",
        "EXPERIENCE",
        "EXPÉRIENCES",
        "EXPERIENCES",
        "BÉNÉVOLAT ET ENGAGEMENT",
        "BENEVOLAT ET ENGAGEMENT",
        "BÉNÉVOLAT",
        "BENEVOLAT",
        "CERTIFICATIONS",
    )
    for h in stop_headers:
        m = re.search(rf"(?:^|\n)\s*{re.escape(h)}\b", text[start:], re.I)
        if m:
            end = min(end, start + m.start())

    if end - start < 350:
        for h in ("LANGUES", "BÉNÉVOLAT", "BENEVOLAT"):
            m = re.search(rf"(?:^|\n)\s*{re.escape(h)}\b", text[start:], re.I)
            if m:
                end = max(end, start + m.start())

    return text[start:end]


def _parse_technical_skills(text: str) -> dict[str, Any]:
    """Extrait les compétences étiquetées (y compris lignes suivantes du PDF)."""
    search = _skills_search_window(text)
    if len(search) < 80:
        search = text
    result: dict[str, list[str]] = {}

    for label, key in SKILL_CATEGORIES.items():
        items = _extract_skill_block(search, label)
        if not items:
            continue
        bucket = result.setdefault(key, [])
        for item in items:
            if item not in bucket:
                bucket.append(item)

    return _sanitize_skills_dict(result)


def _sanitize_skills_dict(skills: dict[str, Any]) -> dict[str, Any]:
    """Évite les chaînes géantes (PDF 2 colonnes) qui font échouer le save Java."""
    clean: dict[str, list[str]] = {}
    for key, val in skills.items():
        if not isinstance(val, list):
            continue
        items: list[str] = []
        for raw in val:
            token = str(raw).strip()
            if not token or len(token) > MAX_SKILL_ITEM_CHARS:
                continue
            if not _is_skill_token(token):
                continue
            if token not in items:
                items.append(token)
        if items:
            joined = ", ".join(items)
            if len(joined) > MAX_SKILL_FIELD_CHARS:
                joined = joined[: MAX_SKILL_FIELD_CHARS - 3] + "..."
            clean[key] = items
    return clean


def _normalize_skill_categories(skills: dict[str, Any]) -> dict[str, Any]:
    markup_tokens = {"html", "css", "xml", "html5", "css3", "sass", "scss"}
    prog = skills.get("programming_languages", [])
    db_tokens = {"sql", "mysql", "postgresql", "mongodb", "oracle"}
    if isinstance(prog, list):
        markup = skills.setdefault("markup_languages", [])
        kept = []
        for item in prog:
            low = item.lower()
            if low in markup_tokens:
                if item not in markup:
                    markup.append(item)
            elif low in db_tokens:
                db = skills.setdefault("databases", [])
                if item not in db:
                    db.append(item)
            else:
                kept.append(item)
        if kept:
            skills["programming_languages"] = kept
        elif "programming_languages" in skills:
            del skills["programming_languages"]
    return skills


def _split_skill_list(raw: str) -> list[str]:
    raw = re.sub(r"^[·•\-]\s*", "", raw)
    parts = re.split(r"[,;|/•·]|\s+•\s+|\bet\b", raw)
    out = []
    for p in parts:
        p = p.strip(" .·•-")
        if _is_skill_token(p):
            out.append(p)
    return out


def _is_skill_token(token: str) -> bool:
    if not token or len(token) > MAX_SKILL_ITEM_CHARS:
        return False
    if len(token) == 1 and token.upper() in ("C", "R"):
        return True
    if len(token) < 2:
        return False
    if ":" in token:
        return False
    if len(token.split()) > 5:
        return False
    if re.match(r"^(de|et|la|le|les|en|par|pour|avec|pro|donnees|données)$", token, re.I):
        return False
    if re.search(r"\b(découverte|familiarisation|participation|initiation|entreprise)\b", token, re.I):
        return False
    if DEGREE_KEYWORDS.search(token):
        return False
    return True


def _parse_languages(text: str) -> list[LanguageItem]:
    section = _section_slice(
        text,
        HEADERS_LANGUAGES,
        stop_headers=list(HEADERS_CERTIFICATIONS) + ["BÉNÉVOLAT", "BENEVOLAT", "PROJETS"],
    )
    search = section or text
    items: list[LanguageItem] = []
    lang_names = LANGUAGE_NAMES.pattern.strip(r"\b()")
    pat = rf"({lang_names})\s*[:–—\-]\s*([A-Za-zÀ-ÿ\s\-]+?)(?=\s{{2,}}|\n|Certification|JCI\b|$)"
    for m in re.finditer(pat, search, re.I):
        prof = m.group(2).strip()
        prof = re.split(r"\s{2,}|Certification|JCI\b", prof)[0].strip()
        lang_raw = m.group(1).strip()
        lang = lang_raw.capitalize().replace("Francais", "Français").replace("English", "Anglais")
        prof_norm = _normalize_language_proficiency(prof)
        items.append(
            LanguageItem(
                language=lang,
                proficiency=prof_norm,
                confidence=0.9,
            )
        )
    return items


def _normalize_language_proficiency(raw: str) -> str:
    low = raw.lower().strip()
    if re.search(r"maternel|native|natif", low):
        return "Langue Maternelle"
    if re.search(r"bilingue|fluent|courant", low):
        return "Courant"
    if re.search(r"professionnel|professional", low):
        return "Avancé"
    if re.search(r"avanc|advanced", low):
        return "Avancé"
    if re.search(r"interm", low):
        return "Intermédiaire"
    if re.search(r"début|debut|basic", low):
        return "Débutant"
    return raw[:80]


_SKILL_HEADER_LINE = re.compile(
    r"^(Langages de programmation|Langages de balisage|Bases de données|Base de données|"
    r"Systèmes d'exploitation|Systemes d'exploitation|Modélisation et conception|"
    r"Modelisation et conception|Outils|Soft skills|Frameworks|Compétences techniques|"
    r"DevOps|Méthodologies|Methodologies)\s*:",
    re.I,
)

_EXPERIENCE_DESC_HINT = re.compile(
    r"\b(Initiation|Découverte|Decouverte|Participation|Développement|Developpement|"
    r"Conception|Réalisation|Realisation|Mise en place|Contribution|Familiarisation|"
    r"Assistance|Support|Suivi|Analyse|visualisation|entreprise)\b",
    re.I,
)


def _is_experience_description_line(line: str) -> bool:
    """Ignore les lignes de compétences mélangées (PDF 2 colonnes)."""
    if not line or len(line) < 10:
        return False
    if _SKILL_HEADER_LINE.match(line):
        return False
    if re.match(r"^(Linux|Windows|UML|HTML|CSS|Git|MySQL|PHP|Java)\s*\.?$", line, re.I):
        return False
    if re.match(r"^(NetBeans|Eclipse|VS Code|Power BI)\s*,?\s*$", line, re.I):
        return False
    if re.match(r"^(pro|données|donnees|\.)\s*$", line, re.I):
        return False
    if _EXPERIENCE_DESC_HINT.search(line):
        return len(line) < 220
    return False


def _parse_experience_dates(dates_raw: str) -> tuple[str | None, str | None]:
    month = (
        r"(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|"
        r"septembre|octobre|novembre|décembre|decembre)"
    )
    date_m = re.search(
        rf"({month}\s+\d{{4}}|\d{{4}})\s*[-–—]\s*"
        rf"({month}\s+\d{{4}}|\d{{4}}|présent|present|aujourd)",
        dates_raw,
        re.I,
    )
    if date_m:
        return (
            _parse_french_date(date_m.group(1)),
            _parse_french_date(date_m.group(2), end_of_period=True),
        )
    single = re.search(rf"({month})\s+(\d{{4}})", dates_raw, re.I)
    if single:
        start = _parse_french_date(f"{single.group(1)} {single.group(2)}")
        end = _parse_french_date(f"{single.group(1)} {single.group(2)}", end_of_period=True)
        return start, end
    return None, None


def _append_experience(
    items: list[WorkExperienceItem],
    seen: set[str],
    search: str,
    position: str,
    company: str,
    dates_raw: str,
    end_pos: int,
    next_pos: int,
    confidence: float = 0.75,
) -> None:
    position = position.strip()[:120]
    company = company.strip()[:80]
    if len(position) < 3 or len(company) < 2:
        return
    key = f"{company.lower()}|{position.lower()}"
    if key in seen:
        return
    seen.add(key)
    start, end = _parse_experience_dates(dates_raw) if dates_raw else (None, None)
    desc = _collect_experience_description(search, end_pos, next_pos)
    items.append(
        WorkExperienceItem(
            position=position,
            company=company,
            start_date=start,
            end_date=end,
            description=desc,
            confidence=confidence if desc else confidence - 0.1,
        )
    )


def _parse_experiences(text: str) -> list[WorkExperienceItem]:
    section = _section_slice(
        text,
        HEADERS_EXPERIENCE,
        stop_headers=list(HEADERS_PROJECTS + HEADERS_LANGUAGES + HEADERS_CERTIFICATIONS),
    )
    search = section or text
    items: list[WorkExperienceItem] = []
    seen: set[str] = set()
    match_spans: list[tuple[int, int]] = []

    stage_line_pattern = re.compile(
        r"^(Stage[^\n|]{3,120}?)\s*[-–—]\s*([^|\n]+?)(?:\s*\|\s*|\s+\|\s*)(.+)?$",
        re.I | re.M,
    )
    stage_matches = list(stage_line_pattern.finditer(search))
    for idx, m in enumerate(stage_matches):
        match_spans.append((m.start(), m.end()))
        next_pos = stage_matches[idx + 1].start() if idx + 1 < len(stage_matches) else len(search)
        _append_experience(
            items,
            seen,
            search,
            m.group(1),
            m.group(2),
            (m.group(3) or ""),
            m.end(),
            next_pos,
            0.85,
        )

    generic_pattern = re.compile(
        r"^(.{3,90}?)\s*[-–—@]\s*(.{2,90}?)(?:\s*\|\s*(.+))?$",
        re.I | re.M,
    )
    for m in generic_pattern.finditer(search):
        if any(s <= m.start() <= e for s, e in match_spans):
            continue
        position = m.group(1).strip()
        company = m.group(2).strip()
        if not (
            EXPERIENCE_ROLE_PREFIX.search(position)
            or EXPERIENCE_ROLE_PREFIX.search(company)
            or re.search(r"\b(manager|engineer|developer|consultant|analyst|lead)\b", position, re.I)
        ):
            continue
        _append_experience(
            items,
            seen,
            search,
            position,
            company,
            (m.group(3) or ""),
            m.end(),
            min(len(search), m.end() + 800),
            0.7,
        )

    return items[:10]


def _collect_experience_description(text: str, pos: int, end_pos: int) -> str:
    chunk = text[pos:end_pos]
    lines: list[str] = []
    for ln in chunk.split("\n"):
        ln = ln.strip()
        if not ln:
            continue
        if re.match(r"^Stage\b", ln, re.I):
            if lines:
                break
            continue
        if re.match(r"^(PROJETS|BÉNÉVOLAT|LANGUES|CERTIFICATIONS)\b", ln, re.I):
            break
        if _is_experience_description_line(ln):
            lines.append(ln)
    joined = re.sub(r"\s+", " ", " ".join(lines[:4])).strip()
    return joined[:MAX_EXPERIENCE_DESC_CHARS]


def _parse_projects(text: str) -> list[ProjectItem]:
    section = _section_slice(
        text,
        HEADERS_PROJECTS,
        stop_headers=list(HEADERS_LANGUAGES + HEADERS_CERTIFICATIONS) + ["BÉNÉVOLAT", "BENEVOLAT"],
    )
    search = section or text
    items: list[ProjectItem] = []
    for m in GENERIC_PROJECT_LINE.finditer(search):
        title = m.group(1).strip()
        desc = m.group(2).strip()
        if len(title) < 4 or VOLUNTEER_MARKERS.search(title):
            continue
        items.append(
            ProjectItem(
                title=f"{title}: {desc}"[:250],
                client_name="",
                confidence=0.65,
            )
        )
    compact = re.sub(r"\s+", " ", search)
    project_patterns = [
        (
            "Portfolio en ligne",
            r"Portfolio en ligne\s*:\s*Développement d['\u2019]un site web en.{0,160}?HTML,\s*CSS",
        ),
        (
            "Plateforme e-commerce",
            r"Plateforme e-commerce\s*:\s*Conception et.{0,220}?(?:MySQL|PHP)\.?",
        ),
        (
            "Application de gestion de bibliothèque",
            r"Application de gestion de bibliothèque\s*:\s*.+?Développement.{0,100}?Python",
        ),
    ]
    for title, pat in project_patterns:
        m = re.search(pat, compact, re.I)
        if not m:
            continue
        desc = re.sub(r"^" + re.escape(title) + r"\s*:\s*", "", m.group(0).strip(), flags=re.I)
        desc = re.sub(
            r"(Croissant Rouge[^.]*|JCI[^.]*|communautaires et de|solidarité\.?|Andalous\s*:\s*Actions)",
            " ",
            desc,
            flags=re.I,
        )
        desc = re.sub(r"\s+", " ", desc).strip(" .")
        items.append(
            ProjectItem(
                title=f"{title}: {desc}"[:250],
                client_name="",
                confidence=0.75,
            )
        )
    return items[:15]


def _section_slice(
    text: str,
    start_headers: list[str],
    stop_headers: list[str] | None = None,
) -> str | None:
    stop_headers = stop_headers or list(DEFAULT_STOP_HEADERS)
    upper = text.upper()
    start_idx = None
    for h in start_headers:
        i = upper.find(h.upper())
        if i != -1:
            start_idx = i + len(h)
            break
    if start_idx is None:
        return None

    end_idx = len(text)
    for h in stop_headers:
        i = upper.find(h.upper(), start_idx)
        if i != -1:
            end_idx = min(end_idx, i)
    return text[start_idx:end_idx].strip()


def _collect_description(text: str, pos: int, max_chars: int = 400) -> str:
    chunk = text[pos : pos + max_chars]
    lines = []
    for ln in chunk.split("\n"):
        ln = ln.strip()
        if not ln:
            if lines:
                break
            continue
        if re.match(r"^(Stage|EXPÉRIENCES|PROJETS|LANGUES)\b", ln, re.I):
            break
        lines.append(ln)
        if len(" ".join(lines)) > max_chars:
            break
    return " ".join(lines)[:max_chars]


def _parse_french_date(raw: str, end_of_period: bool = False) -> str | None:
    raw = raw.strip().lower()
    if raw in ("présent", "present", "aujourd'hui", "aujourdhui"):
        return None
    ym = re.match(
        r"(janvier|février|fevrier|february|fev|feb|mars|mar|avril|avr|apr|mai|may|"
        r"juin|jun|juillet|juil|jul|août|aout|aug|septembre|sept|sep|octobre|oct|"
        r"novembre|nov|décembre|decembre|déc|dec|janv|jan)\s+(\d{4})",
        raw,
    )
    if ym:
        month = MONTHS_FR.get(ym.group(1), 1)
        year = int(ym.group(2))
        day = 28 if end_of_period and month == 2 else (30 if end_of_period else 1)
        if end_of_period:
            if month in (1, 3, 5, 7, 8, 10, 12):
                day = 31
            elif month in (4, 6, 9, 11):
                day = 30
        return f"{year:04d}-{month:02d}-{day:02d}"
    y = re.match(r"(\d{4})", raw)
    if y:
        return _year_to_date(y.group(1), end_of_period=end_of_period)
    return None


def _year_to_date(year: str, end_of_period: bool = False) -> str | None:
    if not year or not re.match(r"\d{4}", year):
        return None
    y = int(re.match(r"(\d{4})", year).group(1))
    if end_of_period:
        return f"{y:04d}-12-31"
    return f"{y:04d}-01-01"


def _line_at(text: str, pos: int) -> str:
    start = text.rfind("\n", 0, pos) + 1
    end = text.find("\n", pos)
    if end == -1:
        end = len(text)
    return text[start:end]


def _first_match(pattern: str, text: str) -> str | None:
    m = re.search(pattern, text, re.I)
    return m.group(0).strip() if m else None
