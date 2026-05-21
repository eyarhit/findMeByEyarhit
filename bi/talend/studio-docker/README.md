# Talend Open Studio — Docker (interface graphique)

Interface **identique au poste local** : bureau Linux + **Talend Open Studio** accessible dans le navigateur.

## URL

| Service | URL | Identifiants |
|---------|-----|--------------|
| Bureau + Talend (noVNC) | http://localhost:6080 | mot de passe VNC : `findme` |

Depuis l’app : **Admin → BI → Ouvrir Talend Open Studio**

## Première utilisation (installateur Talend)

1. Télécharger **Talend Open Studio for Data Integration** (Linux x86_64) sur [talend.com](https://www.talend.com/products/talend-open-studio/).
2. Copier l’archive dans :
   ```
   bi/talend/studio-docker/installer/Talend-Studio-8.x.x-linux-gtk-x86_64.tar.xz
   ```
3. Reconstruire et démarrer :
   ```cmd
   docker compose build talend-studio
   docker compose up -d talend-studio
   ```

Le job documenté du PFE est dans le conteneur : `/home/kasm-user/findme-talend/FindMe_Load_DW`.

## Connexion MySQL (dans Talend Studio)

| Champ | Valeur |
|-------|--------|
| Host | `mysql` (réseau Docker) ou `host.docker.internal` |
| Port | `3306` |
| Bases OLTP | `user_bd`, `mission_bd`, `cv_bd`, … |
| DW | `findme_dw` |

## Alignement cours BIS

- **Conception ETL** : job graphique `FindMe_Load_DW` (tMap, tMysqlInput, …)
- **Exécution automatisée** : service `talend-etl` (même logique que le job)
