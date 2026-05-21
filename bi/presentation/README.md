# Présentation PFE & exports PDF

| Fichier | Rôle |
|---------|------|
| [GUIDE_EXPORT_PDF.md](GUIDE_EXPORT_PDF.md) | Export manuel + script |
| [export_metabase_pdfs.py](export_metabase_pdfs.py) | Tentative API PDF |
| [../docs/BI_PRESENTATION_PFE.md](../../docs/BI_PRESENTATION_PFE.md) | **20 slides** prêtes à copier |
| [exports/](exports/) | PDF générés (non versionnés) |

## Commandes

```powershell
# Données à jour + Metabase
.\scripts\bi_refresh.ps1

# PDF (API ou liens manuels)
.\scripts\export_metabase_pdfs.ps1
```

## Slides PowerPoint

1. Ouvrir `docs/BI_PRESENTATION_PFE.md`
2. Une section `## Slide N` = une diapositive
3. Insérer captures depuis `exports/` ou Metabase
