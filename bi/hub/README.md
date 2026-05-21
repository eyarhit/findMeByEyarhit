# Console BI (`bi-hub`)

Interface web Docker pour le PFE **sans configuration manuelle** :

| URL | Rôle |
|-----|------|
| http://localhost:3032/?tab=talend | Job Talend, lancer ETL, journal en direct |
| http://localhost:3032/?tab=powerbi | Aperçu OLAP navigateur + paramètres Power BI Desktop |
| http://localhost:3032/?tab=dw | Compteurs tables `findme_dw` |

## Démarrage

Inclus dans `docker compose up -d` (service `bi-hub`, port **3032**).

- Variable `BI_AUTO_ETL=1` (défaut) : charge `findme_dw` au premier démarrage si vide.
- Boutons depuis l’app : **Admin → Tableaux de bord BI**.

## Limites (formation)

- **Talend Open Studio** (GUI graphique) reste un outil Windows à installer pour les captures rapport ; la console montre le **pipeline** et l’**exécution Docker** (même logique que le job).
- **Power BI Desktop** est Windows ; la console fournit l’**aperçu navigateur** et les identifiants préremplis. Les fichiers `.pbix` dans `bi/powerbi/reports/` sont téléchargeables depuis la console.
