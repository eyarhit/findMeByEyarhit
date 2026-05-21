# Bloc 6c — Gouvernance, accès & RGPD

## Profils et droits

| Profil | findme_dw | Metabase | Admin Angular BI |
|--------|-----------|----------|------------------|
| **ADMIN** | Lecture via `findme_bi` | Admin + tous dashboards | Oui |
| **DRH / Recruteur ESN** | Non (cible : collection filtrée) | Groupe « Recrutement » | Non (hors scope app) |
| **Manager** | Non | Futur : RLS par équipe | Non |
| **Candidat** | Aucun | Aucun | Non |

**Compte technique :**

| Compte | Droits |
|--------|--------|
| `findme_bi` | `SELECT` sur `findme_dw` uniquement |
| `root` / ETL | `INSERT/UPDATE/DELETE` ETL seulement |

## Données personnelles

| Donnée | Présence entrepôt | Mesure |
|--------|-------------------|--------|
| Email | Non (seulement `user_id`) | Minimisation |
| Nom / prénom | Non dans DW | OK |
| Pays, sexe | Oui (`dim_user`) | Agrégats uniquement en dashboard |
| `user_id_degen` notifications | Identifiant texte | Limiter export |

## Base légale (cadre PFE / démo)

- Intérêt légitime : pilotage plateforme recrutement
- Pas de revente de données
- Environnement **démo / formation** — données de test recommandées

## Durée de conservation

| Zone | Durée suggérée |
|------|----------------|
| OLTP | Politique application |
| `findme_dw` | Réaligné OLTP ; purge si suppression compte |
| Metabase | Métadonnées hors PII |
| `etl_run_log` | 90 jours |

## Droits des personnes

Pour un déploiement production :

- Droit d’accès : requête OLTP `user_bd` (pas DW seul)
- Droit à l’effacement : cascade OLTP + **re-ETL**
- Portabilité : export via API user-service

## Sécurité technique

- Mots de passe Metabase / MySQL via variables `docker-compose` (pas dans Git)
- `.env` gitignoré
- HTTPS en production (`MB_SITE_URL`)
- Pas d’iframe Metabase (réduit fuite session)

## Livrables Bloc 6

- `data_dictionary.md`
- `data_quality_rules.md`
- Ce document `rgpd_access.md`

## Checklist avant soutenance

- [ ] Compte `findme_bi` mot de passe changé si démo publique
- [ ] Pas de données réelles sensibles dans volumes Docker partagés
- [ ] Mention limites RGPD dans rapport (données agrégées BI)
