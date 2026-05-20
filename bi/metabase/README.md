# Find-Me BI - Metabase

Ce dossier contient le seed automatique Metabase, les requetes SQL par domaine et la documentation d'exploitation BI pour la plateforme Find-Me.

## Acces Metabase

- URL: `http://localhost:3030`
- Email admin: `bi-admin@findme.local`
- Mot de passe admin: `FindMe_BI_Auto_2026!xQ7vM2`
- Utilisateur MySQL lecture seule: `findme_bi`
- Mot de passe MySQL lecture seule: `findme_bi_readonly`

## Ce que mesurent les 12 requetes BI

1. `Utilisateurs par role`  
   Mesure la repartition des profils (admin, candidat, roles recruteurs ESN) pour piloter la structure de la base utilisateurs.

2. `Inscriptions par mois`  
   Mesure la dynamique temporelle des profils utilisateurs (mois de reference base sur `date_of_birth` si `created_at` absent), utile pour detecter les periodes de croissance.

3. `Top 10 competences CV`  
   Mesure les competences techniques les plus frequentes dans les CV pour adapter les missions aux stacks dominantes.

4. `Missions par statut`  
   Mesure le stock des missions `OPEN`/`CLOSED` et met en evidence la pression sur le pipeline d'offres.

5. `Candidatures par mission (Top 10)`  
   Mesure les missions les plus sollicitees pour orienter les priorites de traitement RH.

6. `Taux de conversion candidatures`  
   Mesure la performance de transformation des candidatures en statuts acceptes.

7. `Evolution candidatures par mois`  
   Mesure la tendance de volume des postulations dans le temps, utile pour prevoir la charge recruteurs.

8. `Score moyen par quiz`  
   Mesure le niveau moyen global des passages quiz.

9. `Taux de reussite quiz`  
   Mesure le ratio de reussite global sur les quiz passes.

10. `Score moyen CodingGame par defi`  
    Mesure la performance moyenne par framework (utilise comme defi technique).

11. `Taux de completion defis CodingGame`  
    Mesure la capacite des candidats a terminer les sessions devaluation par framework.

12. `Vue globale KPIs`  
    Mesure les indicateurs executifs de pilotage: total utilisateurs, candidats, recruteurs.

## Ajouter une nouvelle question Metabase manuellement

1. Ouvrir Metabase puis `+ Nouveau`.
2. Choisir `Question`.
3. Selectionner la base cible (`user_bd`, `cv_bd`, `mission_bd`, `quiz_bd`, `codingame_bd`).
4. Choisir `Requete native`.
5. Coller la requete SQL.
6. Executer la requete et regler la visualisation.
7. Enregistrer la question dans la collection `Find-Me BI`.
8. Ajouter la carte au dashboard `Find-Me — BI complet`.

## Reset complet du seed

Utiliser un reset total de volumes pour relancer setup + seed:

```bash
docker compose down -v
docker compose up -d --build
```

Si seul le seed doit etre relance sans reset global, supprimer le volume Metabase puis relancer les services `metabase` et `metabase-seed`.

## Export dashboard en PDF

1. Ouvrir le dashboard `Find-Me — BI complet`.
2. Cliquer sur le menu du dashboard.
3. Selectionner `Exporter`.
4. Choisir le format `PDF`.
5. Telecharger le document pour partage client/interne.

## Troubleshooting

- `DB sync bloquee`  
  Verifier que MySQL est joignable depuis `metabase-seed` (`MYSQL_HOST`, `MYSQL_PORT`) et que le compte `findme_bi` a bien les droits `SELECT`.

- `Seed deja lance`  
  Le script est idempotent: s'il detecte la collection `Find-Me BI`, il sort immediatement avec code 0.

- `Conflit de ports`  
  Si `3030` est occupe, changer le mapping du service Metabase (`ports`) puis mettre a jour l'URL frontend.

- `Erreur de login admin Metabase`  
  Verifier les variables `METABASE_SETUP_EMAIL` et `METABASE_SETUP_PASSWORD` utilisees au premier setup.

- `Visualisation vide`  
  Verifier que les tables Hibernate existent bien dans chaque base, puis lancer une resynchronisation depuis Admin Metabase.

## Mapping entites Hibernate -> tables SQL

### user-service (`user_bd`)

- `User` -> `users`
- `Role` -> `roles`
- `UserProfile` -> `user_profiles`
- `Notification` -> `notification`
- `Message` -> `messages`
- `ChatRoom` -> `chat_rooms`
- `FileData` -> `file_data`
- `Document` -> `document`

### cv-service (`cv_bd`)

- `Cv` -> `cv`
- `Competence` -> `competence`
- `Experience` -> `experience`
- `Education` -> `education`
- `Langue` -> `langue`
- Join tables -> `cv_competence`, `competence_cv`, `cv_langue`, `cv_completed_steps`

### mission-service (`mission_bd`)

- `Mission` -> `mission`
- `Candidature` -> `candidature`
- `Descrip_mission` -> `descrip_mission`
- `ProfilDemande` -> `profil_demande`
- `MissionFavori` -> `mission_favoris`
- `Ville` -> `ville`
- `Pays` -> `pays`

### quiz-service (`quiz_bd`)

- `QuizQuestion` -> `quiz_questions`
- `UserQuizResult` -> `user_quiz_results`

### codingame-service (`codingame_bd`)

- `EvaluationSession` -> `evaluation_session`
- `EvaluationResult` -> `evaluation_result`
- `Question` -> `question`
- `UserAnswer` -> `user_answer`
- `Framework` -> `framework`
- `Domain` -> `domain`
- `Experiencelevel` -> `experiencelevel`
