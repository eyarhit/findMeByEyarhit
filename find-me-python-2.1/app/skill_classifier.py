"""
Reclasse chaque technologie dans le bon champ (frameworks, BDD, outils, etc.).
Corrige les PDF 2 colonnes où tout est mélangé dans « langages » ou « bases de données ».
"""
from __future__ import annotations

import re
from collections import defaultdict

# Clés alignées sur le formulaire Angular / backend
CATEGORY_KEYS = (
    "programming_languages",
    "markup_languages",
    "frameworks",
    "libraries",
    "apis",
    "databases",
    "operating_systems",
    "design",
    "methodologies",
    "design_patterns",
    "architectures",
    "tools",
)

# Expressions multi-mots (testées en premier)
PHRASE_RULES: list[tuple[str, str]] = [
    (r"spring\s+boot", "frameworks"),
    (r"spring\s+framework", "frameworks"),
    (r"rest\s+apis?", "apis"),
    (r"rest\s+api", "apis"),
    (r"node\.?\s*js", "frameworks"),
    (r"react\.?\s*js", "frameworks"),
    (r"vue\.?\s*js", "frameworks"),
    (r"angular\s*js", "frameworks"),
    (r"\.net|asp\.?\s*net", "frameworks"),
    (r"scikit[\s-]?learn", "libraries"),
    (r"machine\s+learning", "methodologies"),
    (r"deep\s+learning", "methodologies"),
    (r"llm\s+integration", "methodologies"),
    (r"natural\s+language\s+processing|\bnlp\b", "methodologies"),
    (r"ci\s*/\s*cd|ci/cd", "methodologies"),
    (r"power\s+bi", "tools"),
    (r"vs\s+code|visual\s+studio\s+code", "tools"),
    (r"amazon\s+web\s+services|\baws\b", "tools"),
    (r"google\s+cloud|\bgcp\b", "tools"),
    (r"microsoft\s+azure|\bazure\b", "tools"),
    (r"sql\s+server", "databases"),
    (r"design\s+patterns?", "design_patterns"),
]

# Un token = un mot (après normalisation)
TOKEN_RULES: dict[str, str] = {}

def _add_tokens(category: str, tokens: list[str]) -> None:
    for t in tokens:
        TOKEN_RULES[t.lower()] = category


_add_tokens("programming_languages", [
    "java", "python", "javascript", "typescript", "php", "ruby", "go", "golang",
    "rust", "kotlin", "swift", "c", "c++", "c#", "csharp", "scala", "dart", "r",
    "matlab", "perl", "lua", "haskell", "elixir", "clojure", "objective-c", "objc",
    "assembly", "fortran", "cobol", "vb", "visual basic",
])

_add_tokens("markup_languages", [
    "html", "html5", "css", "css3", "xml", "xslt", "json", "yaml", "markdown",
    "sass", "scss", "less", "svg",
])

_add_tokens("frameworks", [
    "spring", "react", "angular", "vue", "nestjs", "nextjs", "next.js", "nuxt",
    "django", "flask", "fastapi", "express", "laravel", "symfony", "rails",
    "hibernate", "struts", "quarkus", "micronaut", "dotnet", "blazor",
    "electron", "flutter", "reactnative", "springboot",
])

_add_tokens("libraries", [
    "jquery", "bootstrap", "numpy", "pandas", "matplotlib", "seaborn",
    "tensorflow", "pytorch", "keras", "opencv", "scipy", "sklearn",
    "scikit-learn", "xgboost", "lightgbm", "catboost", "lodash", "rxjs",
    "mapreduce", "spark", "hadoop",
])

_add_tokens("databases", [
    "sql", "mysql", "postgresql", "postgres", "mongodb", "mongo", "redis",
    "oracle", "sqlite", "h2", "mariadb", "cassandra", "dynamodb", "firebase",
    "elasticsearch", "neo4j", "influxdb", "couchdb", "supabase", "plsql",
])

_add_tokens("apis", [
    "rest", "graphql", "grpc", "soap", "websocket", "websockets", "openapi",
    "swagger", "api",
])

_add_tokens("operating_systems", [
    "linux", "windows", "macos", "mac", "ubuntu", "debian", "centos", "redhat",
    "fedora", "android", "ios", "unix", "bsd",
])

_add_tokens("design", [
    "uml", "merise", "bpmn", "archimate", "wireframe", "wireframing", "figma",
    "sketch", "prototype", "prototyping", "erd", "mockup",
])

_add_tokens("methodologies", [
    "agile", "scrum", "kanban", "devops", "tdd", "bdd", "waterfall", "safe",
    "lean", "xp", "crystal", "prince2", "pmp", "itil", "rad", "prototype",
])

_add_tokens("design_patterns", [
    "mvc", "mvp", "mvvm", "singleton", "observer", "factory", "strategy",
    "adapter", "decorator", "facade", "proxy", "builder",
])

_add_tokens("architectures", [
    "microservices", "microservice", "soa", "serverless", "monolith", "monolithic",
    "event-driven", "cqrs", "eda", "layered", "hexagonal", "clean",
])

_add_tokens("tools", [
    "docker", "kubernetes", "k8s", "git", "github", "gitlab", "bitbucket",
    "jenkins", "nginx", "apache", "tomcat", "maven", "gradle", "npm", "yarn",
    "webpack", "vite", "postman", "jira", "confluence", "sonarqube", "sonar",
    "ansible", "terraform", "helm", "prometheus", "grafana", "kafka", "rabbitmq",
    "activemq", "tableau", "powerbi", "intellij", "eclipse", "netbeans", "vscode",
    "ci", "cd", "minio", "swagger-ui", "selenium", "cypress", "junit", "mockito",
])


def _normalize_token(raw: str) -> str:
    return re.sub(r"\s+", " ", raw.strip().lower())


def _split_skill_fragments(raw: str) -> list[str]:
    """Découpe listes « Java, Spring, Docker » en tokens."""
    raw = re.sub(r"^[·•\-]\s*", "", raw.strip())
    parts = re.split(r"[,;|/•·]|\s+•\s+|\s+et\s+|\band\b", raw, flags=re.I)
    out: list[str] = []
    for p in parts:
        p = p.strip(" .·•-")
        if not p or len(p) < 2:
            continue
        if len(p) > 60:
            continue
        out.append(p)
    return out


def classify_fragment(fragment: str) -> str | None:
    low = _normalize_token(fragment)
    if not low or len(low) < 2:
        return None

    for pattern, category in PHRASE_RULES:
        if re.search(pattern, low, re.I):
            return category

    # Token unique ou « spring boot » déjà en un morceau
    words = low.replace(".", " ").split()
    if len(words) >= 2:
        pair = " ".join(words[:2])
        if pair in TOKEN_RULES:
            return TOKEN_RULES[pair]
        joined = "".join(words[:2])
        if joined in TOKEN_RULES:
            return TOKEN_RULES[joined]

    if low in TOKEN_RULES:
        return TOKEN_RULES[low]

    # Sous-chaîne connue (ex: « dock » -> docker si préfixe unique)
    for token, cat in TOKEN_RULES.items():
        if len(token) >= 4 and low.startswith(token):
            return cat
        if len(low) >= 4 and token.startswith(low) and len(low) >= 3:
            return cat

    # Heuristiques
    if re.search(r"\b(api|rest|graphql|grpc)\b", low):
        return "apis"
    if re.search(r"\b(sql|db|database)\b", low):
        return "databases"
    if re.search(r"\b(framework|spring|react|angular|vue)\b", low):
        return "frameworks"

    return None


def reclassify_technical_skills(skills: dict) -> dict[str, list[str]]:
    """
    Fusionne toutes les catégories, reclasse chaque fragment, reconstruit le dict propre.
    """
    fragments: list[str] = []
    if not skills:
        return {}

    for _key, val in skills.items():
        if not isinstance(val, list):
            continue
        for item in val:
            fragments.extend(_split_skill_fragments(str(item)))

    buckets: dict[str, list[str]] = defaultdict(list)
    seen: set[str] = set()

    for frag in fragments:
        cat = classify_fragment(frag)
        if not cat:
            continue
        display = _display_name(frag)
        key = f"{cat}:{display.lower()}"
        if key in seen:
            continue
        seen.add(key)
        if display not in buckets[cat]:
            buckets[cat].append(display)

    return {k: buckets[k] for k in CATEGORY_KEYS if buckets.get(k)}


def _display_name(frag: str) -> str:
    """Garde la casse d'origine raisonnable."""
    frag = frag.strip()
    if frag.isupper() and len(frag) <= 6:
        return frag
    if re.match(r"^[a-z]+\.[a-z]+$", frag, re.I):
        return frag  # Node.js
    return frag[:1].upper() + frag[1:] if frag else frag
