"""
Multilingual CV section headers and patterns (rule-based, grounded extraction).
Covers common FR / EN / ES / DE / IT / AR (Latin script) résumé layouts.
"""

from __future__ import annotations

import re

# --- Section headers (order: longer phrases first where relevant) ---
HEADERS_EDUCATION = [
    "FORMATIONS ACADÉMIQUES",
    "FORMATIONS ACADEMIQUES",
    "ACADEMIC BACKGROUND",
    "ACADEMIC EDUCATION",
    "EDUCATION AND TRAINING",
    "HIGHER EDUCATION",
    "ÉDUCATION",
    "EDUCATION",
    "FORMATION",
    "FORMATIONS",
    "STUDIES",
    "ACADEMIC",
    "EDUCACIÓN",
    "EDUCACION",
    "FORMACIÓN",
    "FORMACION",
    "AUSBILDUNG",
    "BILDUNG",
    "STUDIEN",
    "CURSOS",
    "DIPLOMAS",
    "DIPLÔMES",
]

HEADERS_EXPERIENCE = [
    "EXPÉRIENCES PROFESSIONNELLES",
    "EXPERIENCES PROFESSIONNELLES",
    "PROFESSIONAL EXPERIENCE",
    "WORK EXPERIENCE",
    "EMPLOYMENT HISTORY",
    "CAREER HISTORY",
    "WORK HISTORY",
    "EXPÉRIENCE PROFESSIONNELLE",
    "EXPERIENCE PROFESSIONNELLE",
    "HISTORIQUE PROFESSIONNEL",
    "PARCOURS PROFESSIONNEL",
    "CARRIÈRE",
    "CARRIERE",
    "EXPÉRIENCES",
    "EXPERIENCES",
    "EXPERIENCE",
    "EMPLOYMENT",
    "EXPERIENCIA LABORAL",
    "EXPERIENCIA PROFESIONAL",
    "HISTORIAL LABORAL",
    "BERUFSERFAHRUNG",
    "ERFAHRUNG",
    "PRAKTIKA",
    "INTERNSHIPS",
    "STAGES",
]

HEADERS_SKILLS = [
    "COMPÉTENCES TECHNIQUES",
    "COMPETENCES TECHNIQUES",
    "TECHNICAL SKILLS",
    "TECHNICAL COMPETENCIES",
    "CORE COMPETENCIES",
    "KEY SKILLS",
    "SKILLS SUMMARY",
    "COMPÉTENCES",
    "COMPETENCES",
    "COMPETENCIAS",
    "FÄHIGKEITEN",
    "KENNTNISSE",
    "EXPERTISE",
    "SAVOIR-FAIRE",
    "SAVOIR FAIRE",
]

HEADERS_PROFILE = [
    "PROFESSIONAL SUMMARY",
    "EXECUTIVE SUMMARY",
    "CAREER SUMMARY",
    "PROFILE SUMMARY",
    "RÉSUMÉ PROFESSIONNEL",
    "RESUME PROFESSIONNEL",
    "À PROPOS",
    "A PROPOS",
    "ABOUT ME",
    "ABOUT",
    "PROFIL",
    "PROFILE",
    "SUMMARY",
    "OBJECTIVE",
    "OBJECTIF",
    "PRESENTATION",
    "PRÉSENTATION",
    "PRESENTACIÓN",
    "PRESENTACION",
    "ÜBER MICH",
    "PERSONAL STATEMENT",
]

HEADERS_LANGUAGES = [
    "LANGUAGE SKILLS",
    "LANGUAGE PROFICIENCY",
    "LANGUES",
    "LANGUAGES",
    "IDIOMAS",
    "SPRACHEN",
    "LINGUISTIC",
]

HEADERS_PROJECTS = [
    "PROJETS ACADÉMIQUES",
    "PROJETS ACADEMIQUES",
    "ACADEMIC PROJECTS",
    "KEY PROJECTS",
    "PROJECTS",
    "PROJETS",
    "PROYECTOS",
    "PROJEKTE",
    "PORTFOLIO",
]

HEADERS_CERTIFICATIONS = [
    "CERTIFICATIONS",
    "CERTIFICATES",
    "CERTIFICATS",
    "LICENCES",
    "LICENSES",
    "ACCREDITATIONS",
]

HEADERS_CONTACT = [
    "CONTACT",
    "COORDONNÉES",
    "COORDONNEES",
    "CONTACT INFO",
    "PERSONAL INFO",
    "PERSONAL DETAILS",
    "INFORMATIONS PERSONNELLES",
]

DEFAULT_STOP_HEADERS = (
    HEADERS_EXPERIENCE
    + HEADERS_PROJECTS
    + HEADERS_LANGUAGES
    + HEADERS_CERTIFICATIONS
    + HEADERS_CONTACT
    + ["BÉNÉVOLAT", "BENEVOLAT", "VOLUNTEER", "VOLUNTEERING", "REFERENCES", "RÉFÉRENCES"]
)

DEGREE_KEYWORDS = re.compile(
    r"\b("
    r"licence|license|licenciatura|"
    r"master|maîtrise|maitrise|m\.?sc|m\.?a|mba|"
    r"bachelor|baccalauréat|baccalaureat|b\.?sc|b\.?a|"
    r"ph\.?d|doctorat|doctorate|doctoral|"
    r"ingénieur|ingenieur|engineer|engineering|ingénierie|ingenierie|"
    r"diplôme|diplome|diploma|dut|bts|deug|"
    r"associate|certificat|certificate|certification|"
    r"aérospatial|aerospatial|aéronautique|aeronautique|"
    r"undergraduate|postgraduate|graduate|"
    r"habilitation|magister"
    r")\b",
    re.I,
)

INSTITUTION_MARKERS = (
    "université",
    "universite",
    "university",
    "universidad",
    "universität",
    "college",
    "école",
    "ecole",
    "school",
    "institut",
    "institute",
    "instituto",
    "faculté",
    "faculty",
    "facultad",
    "lycée",
    "lycee",
    "high school",
    "polytechnic",
    "polytechnique",
    "sup",
    "esprit",
    "enim",
    "insat",
    "ipeit",
    "tek-up",
    "mit",
    "harvard",
    "stanford",
    "sorbonne",
    "campus",
    "academy",
    "académie",
    "hochschule",
    "fachhochschule",
    "business school",
)

# Skill category labels (multilingual) -> internal key
SKILL_CATEGORIES: dict[str, str] = {
    # FR
    "langages de programmation": "programming_languages",
    "langages de balisage": "markup_languages",
    "bases de données": "databases",
    "base de données": "databases",
    "systèmes d'exploitation": "operating_systems",
    "systemes d'exploitation": "operating_systems",
    "modélisation et conception": "design",
    "modelisation et conception": "design",
    "frameworks": "frameworks",
    "framework": "frameworks",
    "bibliothèques": "libraries",
    "bibliotheques": "libraries",
    "apis": "apis",
    "api": "apis",
    "méthodologie": "methodologies",
    "methodologie": "methodologies",
    "design pattern": "design_patterns",
    "architecture": "architectures",
    "outils": "tools",
    "soft skills": "methodologies",
    "compétences techniques": "methodologies",
    "competences techniques": "methodologies",
    "compétences personnelles": "methodologies",
    "devops": "tools",
    "intelligence artificielle": "methodologies",
    "sécurité": "methodologies",
    "securite": "methodologies",
    "modélisation numérique": "design",
    "simulation numérique": "design",
    "aérodynamique": "design",
    "mécanique": "design",
    "cao": "tools",
    "cfd": "tools",
    # EN
    "programming languages": "programming_languages",
    "programming language": "programming_languages",
    "markup languages": "markup_languages",
    "databases": "databases",
    "database": "databases",
    "operating systems": "operating_systems",
    "operating system": "operating_systems",
    "frameworks & libraries": "frameworks",
    "libraries": "libraries",
    "tools": "tools",
    "technical skills": "methodologies",
    "core skills": "methodologies",
    "methodologies": "methodologies",
    "methodology": "methodologies",
    "cloud": "tools",
    "devops": "tools",
    "design patterns": "design_patterns",
    "architectures": "architectures",
    "machine learning": "methodologies",
    "data science": "methodologies",
    # ES
    "lenguajes de programación": "programming_languages",
    "lenguajes de programacion": "programming_languages",
    "bases de datos": "databases",
    "sistemas operativos": "operating_systems",
    "herramientas": "tools",
    "metodologías": "methodologies",
    # DE
    "programmiersprachen": "programming_languages",
    "datenbanken": "databases",
    "betriebssysteme": "operating_systems",
    "werkzeuge": "tools",
}

LANGUAGE_NAMES = re.compile(
    r"\b("
    r"français|francais|french|"
    r"anglais|english|inglés|ingles|"
    r"arabe|arabic|arab|"
    r"allemand|german|deutsch|"
    r"espagnol|spanish|español|espanol|"
    r"italien|italian|italiano|"
    r"portugais|portuguese|português|portugues|"
    r"chinois|chinese|mandarin|"
    r"japonais|japanese|"
    r"russe|russian|"
    r"turc|turkish|"
    r"hindi|"
    r"néerlandais|neerlandais|dutch"
    r")\b",
    re.I,
)

# Experience line starters (not only "Stage")
EXPERIENCE_ROLE_PREFIX = re.compile(
    r"^(?:"
    r"stage|stagiaire|intern|internship|apprenti|apprenticeship|"
    r"employé|employe|employee|consultant|freelance|contractor|"
    r"développeur|developpeur|developer|ingénieur|ingenieur|engineer|"
    r"chef de projet|project manager|analyst|analyste|technicien|technician|"
    r"responsable|manager|directeur|director|lead|senior|junior|"
    r"research|recherche|assistant|associate|officer|specialist|"
    r"co-?founder|founder|ceo|cto|cmo"
    r")\b",
    re.I,
)

GENERIC_PROJECT_LINE = re.compile(
    r"^(.{4,80}?)\s*:\s*(.{10,220})$",
    re.M,
)
