# Talend Open Studio — Docker (interface graphique)

Interface **identique au poste local** : bureau Linux + **Talend Open Studio** accessible dans le navigateur.

## URL

| Service | URL | Identifiants |
|---------|-----|--------------|
| Bureau + Talend (noVNC) | http://localhost:6080 | mot de passe VNC : `findme` |

Depuis l’app : **Admin → BI → Ouvrir Talend Open Studio**

## Télécharger Talend (CMD)

Talend ne fournit plus de lien public fixe : copiez le lien après connexion sur le site.

```cmd
REM Option A : URL en argument (lien copie depuis le navigateur)
scripts\download-talend.cmd "https://VOTRE-LIEN-TALEND"

REM Option B : URL dans scripts\.env.bi (TALEND_INSTALLER_URL=...)
copy scripts\.env.bi.example scripts\.env.bi
scripts\download-talend.cmd

docker compose build talend-studio
docker compose up -d talend-studio
```

Equivalent **curl** (si vous avez deja l’URL) :

```cmd
curl -L -o "bi\talend\studio-docker\installer\Talend-Studio-linux.tar.xz" "https://VOTRE-LIEN-TALEND"
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
