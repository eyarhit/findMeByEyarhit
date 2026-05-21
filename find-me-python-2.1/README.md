# Find-Me CV Parser (Python)

Service FastAPI `POST /parse-cv/` — extraction **ancrée dans le PDF** (pas d’invention de données).

## Compatibilité

Le parseur vise une **large couverture** des CV mondiaux en **texte sélectionnable** (PDF natifs, Word→PDF) :

| Langues / régions | Sections reconnues (exemples) |
|-------------------|-------------------------------|
| Français | PROFIL, ÉDUCATION, EXPÉRIENCES, COMPÉTENCES, LANGUES |
| Anglais | PROFILE, EDUCATION, WORK EXPERIENCE, SKILLS, LANGUAGES |
| Espagnol / Allemand | encabezados courants (EDUCACIÓN, BERUFSERFAHRUNG, …) |

**Techniques :** double passe texte + mise en page PDF, sections multilingues, repli (fallback) formations/expériences/compétences, validation « grounded » (chaque champ doit apparaître dans le texte source).

## Limites honnêtes

- **PDF scanné / image** : peu ou pas de texte → extraction impossible sans OCR (non inclus par défaut).
- **Mise en page très créative** (colonnes imbriquées, tableaux complexes) : résultats partiels possibles.
- **100 % des CV de la planète** : aucun système ne garantit cela sans IA lourde ; ce service privilégie **fiabilité** et **pas de hallucination**.

## Tester

```bash
curl -X POST http://localhost:8000/parse-cv/ -F "file=@../docs/sample-cvs/CV-Eya-Rhit-Ingenieur-Aerospatial.pdf"
```

CV texte étudiant (fixture) : `tests/fixtures/eya_rhit_cv_text.txt`

## Générer un CV PDF de test

Voir `../docs/sample-cvs/README.md` et `../scripts/generate_test_cv_eya.py`.
