# CV PDF de test — Eya Rhit

## Fichier

`CV-Eya-Rhit-Ingenieur-Aerospatial.pdf` — CV **Ingénieur aérospatial** (texte sélectionnable, sections alignées avec le parseur FindMe).

## Régénérer le PDF

```cmd
pip install reportlab
python scripts\generate_test_cv_eya.py
```

## Tester le parseur

```cmd
curl -X POST http://localhost:8000/parse-cv/ -F "file=@docs/sample-cvs/CV-Eya-Rhit-Ingenieur-Aerospatial.pdf"
```

## Contenu attendu après import

- **Titre** : Ingénieur aérospatial / modélisation numérique
- **Formation** : ESPRIT (Génie Aérospatial), INSAT
- **Compétences** : Python, ANSYS, CFD, CATIA, etc.
- **Expériences** : Tunis Aerospace Solutions, CST, projet drone
