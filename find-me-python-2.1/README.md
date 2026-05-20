# Find-Me CV Parser (Python / FastAPI)

Service d'extraction de CV PDF pour le front Angular (`POST /parse-cv/`).

## Démarrage local

```bash
cd find-me-python-2.1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API : [http://localhost:8000/docs](http://localhost:8000/docs)

## Docker

```bash
docker compose up python-service --build
```

## Principes d'extraction

- PDF texte uniquement (pas d'hallucination LLM).
- Chaque champ est **vérifié** contre le texte source (grounding).
- Les associations (JCI, Croissant Rouge…) ne sont **pas** converties en formations.
