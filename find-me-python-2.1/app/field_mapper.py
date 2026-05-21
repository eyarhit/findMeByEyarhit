"""
Nettoyage final : place chaque valeur dans le bon type de champ avant validation.
Réduit les erreurs OCR / colonnes mélangées.
"""
from __future__ import annotations

import re

from .models import EducationItem, LanguageItem, ParseData, WorkExperienceItem


def apply_field_mapping(data: ParseData) -> ParseData:
    if data.personal_info:
        pi = data.personal_info
        if pi.email:
            pi.email = pi.email.strip().lower()
        if pi.phone:
            pi.phone = re.sub(r"\s+", " ", pi.phone.strip())
        if pi.job_title:
            pi.job_title = _clean_line(pi.job_title, 220)
        if pi.full_name:
            pi.full_name = _clean_line(pi.full_name, 80)

    cleaned_edu: list[EducationItem] = []
    for edu in data.education:
        inst = _clean_line(edu.institution or "", 120)
        degree = _clean_line(edu.degree or "", 120)
        inst, degree = _split_institution_degree(inst, degree)
        if not inst and not degree:
            continue
        cleaned_edu.append(
            EducationItem(
                institution=inst or None,
                degree=degree or None,
                start_date=_norm_date(edu.start_date),
                end_date=_norm_date(edu.end_date),
                confidence=edu.confidence,
            )
        )
    data.education = cleaned_edu

    cleaned_exp: list[WorkExperienceItem] = []
    for exp in data.work_experiences:
        desc = _clean_line(exp.description or "", 240)
        cleaned_exp.append(
            WorkExperienceItem(
                company=_clean_line(exp.company or "", 80),
                position=_clean_line(exp.position or "", 120),
                start_date=_norm_date(exp.start_date),
                end_date=_norm_date(exp.end_date),
                description=desc or None,
                confidence=exp.confidence,
            )
        )
    data.work_experiences = cleaned_exp

    cleaned_langs: list[LanguageItem] = []
    for lang in data.languages:
        name = _clean_line(lang.language or "", 40)
        if not name:
            continue
        cleaned_langs.append(
            LanguageItem(
                language=name,
                proficiency=_clean_line(lang.proficiency or "", 40),
                confidence=lang.confidence,
            )
        )
    data.languages = cleaned_langs

    if data.technical_skills:
        for key, val in list(data.technical_skills.items()):
            if isinstance(val, list):
                data.technical_skills[key] = [_clean_line(str(s), 80) for s in val if str(s).strip()]

    return data


def _clean_line(s: str, max_len: int) -> str:
    s = re.sub(r"\s+", " ", (s or "").strip())
    if len(s) > max_len:
        return s[: max_len - 3] + "..."
    return s


def _norm_date(d: str | None) -> str | None:
    if not d:
        return None
    d = d.strip()
    if re.match(r"\d{4}-\d{2}-\d{2}", d):
        return d
    return d


def _split_institution_degree(inst: str, degree: str) -> tuple[str, str]:
    """ESPRIT - [2023-2025] dans université vs diplôme sur ligne suivante."""
    if inst and re.fullmatch(r"[\w\s\-–—\[\]()]+20\d{2}[\w\s\-–—\[\]()]*", inst, re.I):
        years = re.search(r"(20\d{2})\s*[-–—]\s*(20\d{2}|present|présent)", inst, re.I)
        if years and not degree:
            name = re.sub(r"\s*[\[\(]?\s*20\d{2}.*", "", inst).strip(" -–—")
            return name, degree
    if degree and inst and degree.lower() == inst.lower():
        return inst, ""
    if inst and not degree and re.search(r"\b(licence|master|bachelor|ingénieur|engineer)\b", inst, re.I):
        return "", inst
    return inst, degree
