# Power BI Report Server — Docker (interface web Microsoft)

Produit **Microsoft Power BI** (famille Report Server) : portail web pour rapports OLAP, drill-down, filtres — équivalent démo **entreprise** au Desktop.

## URL (après démarrage)

| Portail | URL |
|---------|-----|
| Rapports (OLAP) | http://localhost:8077/reports |
| API / admin | http://localhost:8077/reportserver |

Identifiants par défaut du conteneur : `PBIRSAdmin` / `FindMe_PBIRS@123`

## Démarrage (Windows — Docker en mode conteneurs Windows)

```cmd
docker compose -f docker-compose.yml -f docker-compose.powerbi-windows.yml --profile bi-powerbi up -d powerbi-rs
```

Ou script : `scripts\docker-bi-powerbi-windows.cmd`

## Publier les .pbix Find-Me

1. Ouvrir http://localhost:8077/reports  
2. Se connecter (`PBIRSAdmin`)  
3. **Importer** les fichiers depuis `bi/powerbi/reports/*.pbix`  
4. Source de données : MySQL `findme_dw` sur `host.docker.internal:3306` (compte `findme_bi`)

> **Création / édition avancée des .pbix** : possible via Power BI Desktop sur Windows, puis publication sur le Report Server — ou création directe dans le portail pour rapports paginés.

## Alignement cours BIS

| Notion cours | Report Server Docker |
|--------------|----------------------|
| OLAP | Navigation, filtres, drill dans le portail |
| Mesures / dimensions | Modèle sémantique des .pbix |
| 3 niveaux décisionnels | 3 rapports Executive / Managérial / Opérationnel |

Le service `bi-hub` et l’admin Angular embarquent ce portail en iframe lorsque `powerbi-rs` est actif.
