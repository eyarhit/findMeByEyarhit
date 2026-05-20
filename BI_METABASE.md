# Business Intelligence — Metabase + MySQL Find-Me

Cette intégration ajoute **Metabase** (outil BI open-source) branché sur les mêmes bases MySQL que les microservices (`user_bd`, `cv_bd`, `mission_bd`, `quiz_bd`, `codingame_bd`), avec un compte SQL **lecture seule** `findme_bi`.

## Compte Metabase (admin UI) — créé automatiquement en Docker

Avec le **`docker compose`** du projet, le conteneur **`metabase-seed`** provisionne l’instance (premier lancement uniquement, ou après reset du volume `metabase_data`) :

| | Valeur |
|---|--------|
| URL | [http://localhost:3030](http://localhost:3030) |
| Email | `bi-admin@findme.local` |
| Mot de passe | `FindMe_BI_Auto_2026!xQ7vM2` (défaut dans `docker-compose.yml`) |
| Tableau de bord | **Find-Me — BI complet** (collection **Find-Me BI**) |

Tu peux surcharger `METABASE_SETUP_EMAIL` et `METABASE_SETUP_PASSWORD` dans `docker-compose.yml` (service `metabase-seed`).

## Compte BI (démo) — MySQL lecture seule

| Champ | Valeur |
|--------|--------|
| Utilisateur MySQL | `findme_bi` |
| Mot de passe | `findme_bi_readonly` |

À changer en production.

---

## Mode 1 — Tout dans Docker (`docker compose up`)

1. Depuis la racine du projet : `docker compose up --build`
2. Attendre que MySQL soit healthy (premier démarrage : scripts dans `docker/mysql-init/` créent les bases + `findme_bi`).
3. Ouvrir **Metabase** : [http://localhost:3030](http://localhost:3030)
4. Assistant Metabase : créer un compte admin Metabase (local, pas lié à Find-Me).
5. **Add your data** → **MySQL** :
   - **Name** : `Find-Me MySQL`
   - **Host** : `mysql`
   - **Port** : `3306`
   - **Database name** : `user_bd` (tu peux ajouter d’autres connexions pour `cv_bd`, etc., ou utiliser des requêtes SQL natives multi-bases si activé)
   - **Username** : `findme_bi`
   - **Password** : `findme_bi_readonly`

Pour analyser plusieurs bases, crée **une connexion par base** dans Metabase (même hôte `mysql`, même user, nom de base différent).

### Volume MySQL déjà existant

Si ton volume Docker `mysql_data` existait **avant** ce script d’init, MySQL **n’exécute pas** à nouveau `docker/mysql-init/`. Dans ce cas, exécute manuellement le fichier SQL :

`scripts/bi_mysql_setup_xampp.sql` (adapté : remplace les `CREATE DATABASE` si déjà là ; les `GRANT` suffisent souvent) **ou** connecte-toi en `root` dans le conteneur :

```bash
docker exec -i findme-mysql mysql -uroot -proot < scripts/bi_mysql_setup_xampp.sql
```

(Sous Windows PowerShell, préfère copier-coller le SQL dans un client ou utiliser `Get-Content scripts/bi_mysql_setup_xampp.sql | docker exec -i findme-mysql mysql -uroot -proot`.)

---

## Mode 2 — MySQL XAMPP + Metabase seul dans Docker

1. Démarre **Apache + MySQL** dans XAMPP.
2. Dans **phpMyAdmin** → onglet **SQL** → colle et exécute le contenu de `scripts/bi_mysql_setup_xampp.sql`.
3. Démarre les microservices Find-Me (comme d’habitude) pour que Hibernate remplisse les tables.
4. Lance Metabase :

```bash
docker compose -f docker-compose.bi.yml up -d
```

5. Ouvre [http://localhost:3030](http://localhost:3030), configure l’admin Metabase, puis ajoute MySQL :

   - **Host** : `host.docker.internal` (permet au conteneur d’atteindre le MySQL sur Windows / Docker Desktop)
   - **Port** : `3306`
   - **Database name** : par ex. `mission_bd`
   - **Username** / **Password** : `findme_bi` / `findme_bi_readonly`

### Si Metabase ne joint pas MySQL (connexion refusée)

- Vérifie que MySQL écoute sur toutes les interfaces : dans `my.ini` / `my.cnf`, `bind-address = 0.0.0.0` (puis redémarrage MySQL XAMPP).
- Vérifie le port 3306 non bloqué par le pare-feu.

Ne lance **pas** en même temps le service `mysql` du `docker-compose.yml` principal sur le même port 3306 que XAMPP.

---

## Depuis l’application Angular (admin)

Connecté en **ADMIN**, menu **Espace Utilisateur** → **Tableaux de bord BI** : page avec raccourci et rappel des paramètres de connexion.

---

## Tableau de bord Find-Me (SQL prêt à l’emploi)

Des requêtes **déjà alignées** sur les tables du projet (missions, candidatures, users, CV, quiz, codingame) sont dans le dossier :

**[`bi/metabase/README.md`](bi/metabase/README.md)** (procédure pas à pas + fichiers SQL dans `bi/metabase/sql/`).

Tu crées les questions dans Metabase en copiant ces SQL, puis un dashboard **« Find-Me — Vue opérationnelle »**.

---

## Arrêt Metabase (mode XAMPP seul)

```bash
docker compose -f docker-compose.bi.yml down
```

Stack complet : `docker compose down` (Metabase s’arrête avec le reste).
