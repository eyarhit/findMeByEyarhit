from __future__ import annotations

import re
import unicodedata

from .models import ParseCVResponse, ParseData, ParseValidation, ValidationIssue


def _normalize(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def _skill_token_in_source(skill: str, source: str) -> bool:
    """Accepte les tokens courts (Git, SQL, UML) présents dans le PDF."""
    norm_source = _normalize(source)
    for part in re.split(r"[,;/|]", skill):
        token = _normalize(part.strip())
        if len(token) >= 2 and token in norm_source:
            return True
    return False


def is_grounded(value: str, source: str, min_len: int = 4) -> bool:
    if not value or len(value.strip()) < min_len:
        return False
    norm_source = _normalize(source)
    norm_value = _normalize(value)
    if norm_value in norm_source:
        return True
    # Allow matching on significant tokens (e.g. institution name).
    tokens = [t for t in norm_value.split() if len(t) >= 3]
    if not tokens:
        return False
    matched = sum(1 for t in tokens if t in norm_source)
    return matched / len(tokens) >= 0.75


def validate_and_score(data: ParseData, source_text: str) -> ParseCVResponse:
    issues: list[ValidationIssue] = []
    warnings: list[str] = []
    removed = 0

    grounded_education = []
    for edu in data.education:
        inst_ok = edu.institution and is_grounded(edu.institution, source_text)
        deg_ok = edu.degree and is_grounded(edu.degree, source_text)
        if inst_ok or deg_ok:
            grounded_education.append(edu)
        else:
            removed += 1
            warnings.append(
                f"Formation ignorée (non trouvée dans le PDF): {edu.institution or edu.degree}"
            )
    data.education = grounded_education

    grounded_exp = []
    for exp in data.work_experiences:
        if (exp.company and is_grounded(exp.company, source_text, 3)) or (
            exp.position and is_grounded(exp.position, source_text, 3)
        ):
            grounded_exp.append(exp)
        else:
            removed += 1
    data.work_experiences = grounded_exp

    grounded_projects = []
    for proj in data.projects:
        if proj.title and is_grounded(proj.title, source_text, 5):
            grounded_projects.append(proj)
        else:
            removed += 1
    data.projects = grounded_projects

    grounded_langs = []
    for lang in data.languages:
        if lang.language and is_grounded(lang.language, source_text, 3):
            grounded_langs.append(lang)
        else:
            removed += 1
    data.languages = grounded_langs

    # Filter skill lists
    ts = data.technical_skills
    for key, val in list(ts.items()):
        if not isinstance(val, list):
            continue
        kept = [
            s
            for s in val
            if is_grounded(s, source_text, 2)
            or (len(s.strip()) >= 2 and _skill_token_in_source(s, source_text))
        ]
        removed += len(val) - len(kept)
        if kept:
            ts[key] = kept
        else:
            del ts[key]

    has_content = bool(
        data.personal_info
        and (
            data.personal_info.email
            or data.personal_info.job_title
            or data.personal_info.phone
        )
        or data.education
        or data.work_experiences
        or data.languages
        or any(isinstance(v, list) and v for v in ts.values())
    )

    if not has_content:
        issues.append(
            ValidationIssue(
                field="global",
                message="Aucune information exploitable extraite du PDF.",
                severity="error",
            )
        )

    char_count = len(source_text.strip())
    if char_count < 80:
        issues.append(
            ValidationIssue(
                field="pdf",
                message="PDF quasi vide ou image scannée — utilisez un PDF avec texte sélectionnable.",
                severity="error",
            )
        )

    confidence = _overall_confidence(data)
    can_save = has_content and not any(i.severity == "error" for i in issues)

    return ParseCVResponse(
        data=data,
        metadata={
            "extraction_method": "rule_based_grounded",
            "ocr_quality_score": min(1.0, char_count / 500),
            "ocr_acceptable": char_count >= 80,
            "overall_confidence": confidence,
            "warnings": warnings,
            "grounded_fields_removed": removed,
        },
        validation={
            "is_valid": can_save,
            "can_save": can_save,
            "issues": issues,
        },
    )


def _overall_confidence(data: ParseData) -> float:
    score = 0.0
    if data.personal_info and data.personal_info.job_title:
        score += 0.15
    if data.education:
        score += 0.25
    if data.work_experiences:
        score += 0.25
    ts = data.technical_skills
    if any(isinstance(v, list) and v for v in ts.values()):
        score += 0.2
    if data.languages:
        score += 0.1
    if data.projects:
        score += 0.05
    return min(1.0, score)
