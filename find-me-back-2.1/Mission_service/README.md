# Mission_service

Microservice des offres (missions) — port par défaut **9055**.

## Employés ESN — liste des offres

- **Chemin :** `GET /api/v1/missions/mission/for-ESN-Employee/{userId}?espace=...`
- **Rôle :** retourne les missions dont `user_id` (créateur / société) vaut `{userId}` — le même identifiant que pour `POST /api/v1/missions/create/{userId}`.
- **Réponse :** toujours `200` avec un tableau JSON (vide `[]` s’il n’y a aucune mission ou aucun résultat pour le filtre).
- **Paramètre `espace` (optionnel) :** filtre approximatif sur le libellé d’onglet (insensible à la casse / accents), par ex. :
  - « Offres publier », « offres » → missions ouvertes (`OPEN`), non archivées ;
  - libellé contenant « archiv » → missions archivées ;
  - « ferm », « clôtur », « clos » → missions fermées (`CLOSED`), non archivées ;
  - absent, vide, « tous » / « toutes » / « all » → toutes les missions du créateur.

*(L’ancienne faute d’URL `for-ESN-Emlpoyee` ne correspond à aucune route — utiliser `for-ESN-Employee`.)*

## Marché (toutes les sociétés)

- **Chemin :** `GET /api/v1/missions/mission/market`
- **Rôle :** liste des offres **ouvertes** et **non archivées**, quel que soit le créateur — pour qu’une autre ESN voie les offres publiées par les concurrents.
- **Réponse :** `200` avec un tableau (éventuellement vide).

## Candidats (`GET .../mission/for-user/{userId}`)

Les offres sans pays / ville en base étaient exclues par l’ancienne requête SQL : elles sont désormais **incluses** pour le candidat (visibles sur tout marché cible). Si un pays est renseigné sur l’offre, le filtre par `targetmarket` du candidat s’applique comme avant.
