# Export PDF des dashboards Metabase (Find-Me BI)

## Prérequis

1. Stack démarrée : `docker compose up -d`
2. ETL + seed OK : `.\scripts\bi_refresh.ps1`
3. Metabase : http://localhost:3030  
   - Email : `bi-admin@findme.local`  
   - Mot de passe : `FindMe_BI_Auto_2026!xQ7vM2` (voir `docker-compose.yml`)

## Méthode 1 — Interface Metabase (recommandée soutenance)

Pour chaque dashboard :

| Dashboard | Usage PFE |
|-----------|-----------|
| **Find-Me — BI Executive** | Slide synthèse direction |
| **Find-Me — BI Managérial** | Slide pipeline RH / missions |
| **Find-Me — BI Opérationnel** | Annexe détail |

**Étapes :**

1. Ouvrir le dashboard dans Metabase.
2. Menu **⋮** (en haut à droite) → **Exporter** / **Download as PDF**.
3. Choisir le format **PDF** (paysage recommandé pour les grilles).
4. Enregistrer dans `bi/presentation/exports/` avec un nom explicite :
   - `FindMe-BI-Executive.pdf`
   - `FindMe-BI-Managerial.pdf`
   - `FindMe-BI-Operationnel.pdf`

**Astuce data storytelling :** ajouter une **description** au dashboard dans Metabase (icône info) avec la date du dernier ETL (`etl_run_log`).

## Méthode 2 — Script automatique

```powershell
.\scripts\export_metabase_pdfs.ps1
```

Appelle `bi/presentation/export_metabase_pdfs.py` : tente l’API Metabase et enregistre les PDF dans `bi/presentation/exports/`.

Si l’API renvoie 404/403 (selon version Metabase), le script affiche les liens directs à ouvrir manuellement.

## Méthode 3 — Captures pour PowerPoint

1. Dashboard Metabase en plein écran (F11).
2. `Win + Shift + S` → capture zone graphique clé.
3. Coller dans PowerPoint + légende (titre = **insight**, pas « Graphique 1 »).

## Checklist avant jury

- [ ] ETL relancé le jour J (`docker compose run --rm bi-etl`)
- [ ] 3 PDF exportés ou captures HD
- [ ] Page admin Angular ouverte (3 niveaux dashboards)
- [ ] Schéma architecture `bi/dw/schema.md` imprimé ou en slide

## Fichiers générés

```
bi/presentation/exports/
  FindMe-BI-Executive.pdf
  FindMe-BI-Managerial.pdf
  FindMe-BI-Operationnel.pdf
  export-manifest.json
```

Les PDF ne sont pas versionnés Git (voir `.gitignore`).
