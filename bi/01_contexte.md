# Bloc 1 — Cadrage & besoins (index)

**Statut : ✅ Complet** — détail dans le dossier [01_contexte/](01_contexte/).

| Livrable | Fichier |
|----------|---------|
| Charte BI | [01_contexte/charte_bi.md](01_contexte/charte_bi.md) |
| Personas (5) | [01_contexte/personas.md](01_contexte/personas.md) |
| 27 questions métier | [01_contexte/questions_metier.md](01_contexte/questions_metier.md) |
| MoSCoW | [01_contexte/moscow.md](01_contexte/moscow.md) |

## Architecture

```
OLTP → bi_etl → findme_dw → Metabase (3 dashboards) → bi-manifest.json → Admin Angular
```

→ Suite : [Bloc 2 — dw/schema.md](dw/schema.md)
