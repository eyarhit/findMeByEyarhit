"""Tests de reclassement des compétences techniques."""
from app.skill_classifier import reclassify_technical_skills


def test_misclassified_cv_like_screenshot():
    """Cas type CV 2 colonnes : tout mélangé dans langages / BDD / méthodo."""
    raw = {
        "markup_languages": ["HTML", "CSS"],
        "programming_languages": [
            "Java, TypeScript, Python, JavaScript, Spring, React, Angular, Docker",
        ],
        "frameworks": ["Spring Boot, REST APIs, React.js, Angular, NestJS"],
        "databases": ["MySQL, MongoDB, H2, Kubernetes, CI, CD, Nginx, Git, SonarQube"],
        "methodologies": [
            "LLM Integration, NLP, Machine Learning, XGBoost, Scikit-learn",
        ],
    }
    out = reclassify_technical_skills(raw)

    assert "HTML" in out.get("markup_languages", [])
    assert "CSS" in out.get("markup_languages", [])

    prog = [p.lower() for p in out.get("programming_languages", [])]
    assert "java" in prog
    assert "python" in prog
    assert "spring" not in prog
    assert "react" not in prog
    assert "docker" not in prog

    fw = [f.lower() for f in out.get("frameworks", [])]
    assert any("spring" in f for f in fw)
    assert any("react" in f for f in fw)
    assert any("angular" in f for f in fw)

    db = [d.lower() for d in out.get("databases", [])]
    assert "mysql" in db
    assert "mongodb" in db
    assert "kubernetes" not in db
    assert "git" not in db

    tools = [t.lower() for t in out.get("tools", [])]
    assert any("docker" in t or "kubernetes" in t or "git" in t for t in tools)

    libs = [l.lower() for l in out.get("libraries", [])]
    assert any("xgboost" in l or "scikit" in l for l in libs)

    apis = [a.lower() for a in out.get("apis", [])]
    assert any("rest" in a for a in apis)
