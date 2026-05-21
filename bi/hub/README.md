# Console BI (`bi-hub`)

Portail Docker qui **embarque** les interfaces formation :

| URL | Outil (cours BIS) |
|-----|-------------------|
| http://localhost:6080 | **Talend Open Studio** (bureau + VNC, mot de passe `findme`) |
| http://localhost:8077/reports | **Power BI Report Server** (portail Microsoft OLAP) |
| http://localhost:3032 | Hub : iframes Studio + Power BI + ETL |

## Démarrage

```cmd
scripts\docker-bi-full.cmd
scripts\docker-bi-powerbi-windows.cmd
```

Voir aussi `bi/talend/studio-docker/README.md` et `bi/powerbi/report-server/README.md`.
