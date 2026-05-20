from typing import Any

from pydantic import BaseModel, Field


class PersonalInfo(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    job_title: str | None = None
    linkedin: str | None = None
    location: str | None = None
    confidence: float | None = None


class EducationItem(BaseModel):
    degree: str | None = None
    institution: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    confidence: float | None = None


class LanguageItem(BaseModel):
    language: str | None = None
    proficiency: str | None = None
    confidence: float | None = None


class WorkExperienceItem(BaseModel):
    company: str | None = None
    position: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None
    confidence: float | None = None


class ProjectItem(BaseModel):
    title: str | None = None
    client_name: str | None = None
    team_composition: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    confidence: float | None = None


class ParseData(BaseModel):
    personal_info: PersonalInfo | None = None
    education: list[EducationItem] = Field(default_factory=list)
    technical_skills: dict[str, list[str] | float] = Field(default_factory=dict)
    languages: list[LanguageItem] = Field(default_factory=list)
    work_experiences: list[WorkExperienceItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)


class ParseMetadata(BaseModel):
    extraction_method: str = "rule_based_grounded"
    ocr_quality_score: float = 1.0
    ocr_acceptable: bool = True
    overall_confidence: float = 0.0
    warnings: list[str] = Field(default_factory=list)
    grounded_fields_removed: int = 0


class ValidationIssue(BaseModel):
    field: str
    message: str
    severity: str  # error | warning


class ParseValidation(BaseModel):
    is_valid: bool = True
    can_save: bool = True
    issues: list[ValidationIssue] = Field(default_factory=list)


class ParseCVResponse(BaseModel):
    data: ParseData
    metadata: ParseMetadata
    validation: ParseValidation
