# Module Business Intelligence — Find-Me (support soutenance PFE)

## 1. Contexte et objectifs

Le module BI répond à un besoin de **pilotage décisionnel** sur la plateforme Find-Me (matching candidats / missions ESN). Il permet de :

- Mesurer l’**adoption** (inscriptions, profils, notifications)
- Suivre le **pipeline missions / candidatures** (statuts, conversion, favoris, télétravail)
- Analyser les **compétences CV** issues du parser Python
- Évaluer les **parcours quiz et Codingame**

**Choix technologiques :** Metabase, **entrepôt `findme_dw` en schéma en étoile** (Kimball), ETL Python, Metabase en lecture seule, seed automatisé.

## 2. Architecture technique (schéma en étoile)

```
OLTP (5 bases)  →  ETL (bi-etl)  →  findme_dw
    dim_date, dim_user, dim_mission, dim_skill
    fact_user, fact_mission, fact_candidature, fact_cv, fact_quiz, fact_codingame, …
                              ↓ SELECT (findme_bi)
                         Metabase (:3030)
                              ↓ seed
                    bi-manifest.json → Angular Admin
```

| Couche | Rôle |
|--------|------|
| **OLTP** | Microservices Spring → `user_bd`, `mission_bd`, … |
| **ETL** | `bi/etl/load_star_schema.py` — extract, transform, load |
| **Entrepôt** | `findme_dw` — dimensions + faits + vues `v_bi_*` |
| **BI** | Metabase — une connexion, 23 requêtes sur l’entrepôt |
| **Présentation** | Admin Angular + export PDF Metabase |

- **Séparation OLTP / décisionnel :** l’app écrit en opérationnel ; la BI lit l’entrepôt (pas de requêtes lourdes sur la prod).
- **Schéma en étoile :** tables de **faits** (mesures) + **dimensions** (axes d’analyse) — critère classique PFE / Data Warehouse.

## 3. Sécurité

| Mesure | Détail |
|--------|--------|
| Compte `findme_bi` | Droits SELECT uniquement sur les 5 bases métier |
| Admin Metabase | Compte dédié BI, distinct des utilisateurs Find-Me |
| Front admin | Route protégée rôle ADMIN ; pas d’iframe (CSP Metabase) — liens externes contrôlés |
| Secrets | Mots de passe via variables d’environnement `docker-compose` (`.env` pour mail, pas pour BI en dur en prod) |

## 4. Indicateurs métier (23 cartes)

Regroupés en **5 domaines** dans l’interface admin :

1. **Vue d’ensemble** — KPI exécutifs (effectifs, notifications, documents)
2. **Utilisateurs** — rôles, statuts, pays, activité notifications
3. **Missions** — statuts, volumes mensuels, candidatures, conversion, favoris, télétravail
4. **CV** — créations mensuelles, top compétences, complétion formulaire
5. **Évaluations** — quiz (réussite, score) et Codingame (sessions, scores par framework)

Chaque indicateur est documenté dans [`bi/metabase/README.md`](../bi/metabase/README.md).

## 5. Démo soutenance (scénario 5 min)

1. **Montrer l’app** : créer une mission, une candidature, modifier un CV → données dans MySQL en temps réel.
2. **Ouvrir Metabase** (http://localhost:3030) → dashboard **Find-Me — BI complet** → montrer 2–3 graphiques mis à jour.
3. **Page admin Angular** → onglets BI → ouvrir une carte depuis le manifest (titres corrects, plus d’IDs fictifs).
4. **Export PDF** du dashboard Metabase pour livrable / rapport.
5. **Expliquer le seed** : `bi/metabase/seed_metabase.py` + `docker compose` → reproductibilité pour le jury.

## 6. Commandes utiles

```bash
# Stack complète + BI
docker compose up -d --build

# Regénérer uniquement le manifest (dashboard déjà créé)
docker compose up -d --build metabase-seed

# Reset BI complet
docker compose down
docker volume rm findmebyeyarhit_metabase_data
docker compose up -d --build metabase metabase-seed
```

## 7. Modèle en étoile (détail)

**Dimensions :** `dim_date`, `dim_user`, `dim_mission`, `dim_skill`  
**Faits :** `fact_user`, `fact_notification`, `fact_mission`, `fact_candidature`, `fact_mission_favori`, `fact_cv`, `fact_quiz`, `fact_codingame`  
**DDL :** `docker/mysql-init/05-findme-dw-star-schema.sql`  
**ETL :** `bi/etl/load_star_schema.py` — relance : `docker compose run --rm bi-etl` ou `scripts/bi_refresh.ps1`

## 8. Limites et perspectives

- **ETL full refresh** (pas de delta incrémental) — suffisant pour PFE / volume démo.
- **Pas d’embedding iframe** Metabase → liens nouvel onglet.
- **Évolution :** ETL planifié (cron), SCD type 2 sur `dim_user`, cube sémantique Metabase.

## 9. Références projet

- [`BI_METABASE.md`](../BI_METABASE.md) — déploiement Docker / XAMPP  
- [`bi/metabase/README.md`](../bi/metabase/README.md) — catalogue SQL et troubleshooting  
- Code seed : `bi/metabase/seed_metabase.py`  
- UI admin : `find-me-front-2.1/src/app/admin/bi-dashboard/`
