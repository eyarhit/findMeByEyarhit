# Rapports Power BI — Find-Me

## Fichiers à créer dans Power BI Desktop

| Fichier | Public | Pages suggérées |
|---------|--------|-----------------|
| `01_Executive.pbix` | Direction | KPI cards, courbes candidatures/mois, jauge conversion |
| `02_Managerial.pbix` | DRH / ESN | Missions par statut, top villes (localisation), compétences |
| `03_Operational.pbix` | Ops | Notifications, quiz, évaluations techniques |

## Connexion données

- **Type** : MySQL  
- **Serveur** : `localhost` (port `3306`)  
- **Base** : `findme_dw`  
- **Compte** : `findme_bi` / `findme_bi_readonly`

## Modèle recommandé (étoile)

Relier les faits aux dimensions :

- `fact_candidature` → `dim_date`, `dim_mission`, `dim_localisation` (via mission)
- `fact_mission` → `dim_date`, `dim_mission`, `dim_localisation`

## Mesures DAX (exemples)

```dax
Candidatures = SUM(fact_candidature[candidature_count])
Taux acceptation = DIVIDE(SUM(fact_candidature[is_accepted]), [Candidatures], 0) * 100
```

## IA / analyse avancée (option innovant)

Dans Power BI Desktop : visuels **Q&A**, **Décomposition de la variance**, **Analyse des influences clés** sur le taux d’acceptation.

## Export pour la soutenance

Fichier → **Exporter** → PDF (une page par dashboard).
